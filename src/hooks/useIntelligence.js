import { useState, useEffect } from 'react';
import { 
  ReportsService, 
  FinanceService, 
  AttendanceService, 
  NotificationService 
} from '../api/services';
import { normalizeArrayResponse, normalizeObjectResponse } from '../utils/apiResponse';

/**
 * useIntelligence — Consolidated hook fetching live backend summary endpoints:
 *   - GET /reports/summary (General stats)
 *   - GET /finance/summary (Financial stats)
 *   - GET /attendance/summary (Attendance rates)
 *   - GET /notifications (Recent activity/announcements)
 *
 * Runs requests concurrently and handles individual request failures gracefully.
 */
export const useIntelligence = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Execute all 4 live requests concurrently
            const results = await Promise.allSettled([
                ReportsService.getSummary().catch(e => { throw e; }),
                FinanceService.getSummary().catch(e => { throw e; }),
                AttendanceService.getSummary().catch(e => { throw e; }),
                NotificationService.getAll().catch(e => { throw e; })
            ]);

            const reportsResult = results[0].status === 'fulfilled' ? results[0].value : null;
            const financeResult = results[1].status === 'fulfilled' ? results[1].value : null;
            const attendanceResult = results[2].status === 'fulfilled' ? results[2].value : null;
            const notificationsResult = results[3].status === 'fulfilled' ? results[3].value : null;

            // Log component warnings for failed sub-requests
            results.forEach((res, index) => {
                if (res.status === 'rejected') {
                    console.warn(`[useIntelligence] Endpoint index ${index} failed:`, res.reason);
                }
            });

            // Extract items arrays safely from envelopes
            const rawNotifications = normalizeArrayResponse(notificationsResult, ['notifications', 'items']);

            const rawTransactions = normalizeArrayResponse(financeResult, ['recent_transactions', 'transactions', 'items']);
            const reports = normalizeObjectResponse(reportsResult, ['summary', 'report']);
            const finance = normalizeObjectResponse(financeResult, ['summary']);
            const attendance = normalizeObjectResponse(attendanceResult, ['summary']);

            // Normalize backend shapes to support both standard properties and fallback keys
            const unifiedPayload = {
                reports,
                finance,
                attendance,
                notifications: rawNotifications,
                
                // Backwards compatibility layer for legacy components
                summary: {
                    active_base: reports?.active_members ?? reports?.total_members ?? reports?.members_count ?? 0,
                    new_signups: reports?.new_signups ?? reports?.new_members ?? 0,
                    weekly_active: attendance?.weekly_active ?? attendance?.average_attendance ?? attendance?.attendance_rate ?? 0,
                    retention_risk_count: reports?.retention_risk_count ?? reports?.risk_members ?? 0,
                    health_indicator: reports?.health_indicator || 'Healthy'
                },
                trends: {
                    growth: reports?.growth_trend || [],
                    financials: rawTransactions
                },
                recommendations: reports?.alerts || reports?.recommendations || [
                    { title: 'Treasury Connection Live', text: 'Gatherly double-entry finance ledgers are synchronized.', type: 'info' }
                ]
            };

            setData(unifiedPayload);
        } catch (err) {
            console.error('[useIntelligence] Failed to load dashboard data:', err);
            setError(err.message || 'Error loading dashboard components.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return { 
        data, 
        loading, 
        error, 
        refetch: fetchDashboardData 
    };
};
