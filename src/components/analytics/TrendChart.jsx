import React from 'react';
import { motion } from 'framer-motion';

const TrendChart = ({ data, height = 200, color = '#4F46E5', title }) => {
    if (!data || data.length === 0) return null;

    const maxVal = Math.max(...data.map(d => d.value), 10);
    const padding = 20;
    const chartWidth = 500;
    const chartHeight = height;

    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * (chartWidth - padding * 2) + padding,
        y: chartHeight - ((d.value / maxVal) * (chartHeight - padding * 2) + padding)
    }));

    const pathData = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    const areaData = `${pathData} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

    return (
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <div className="relative" style={{ height }}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(p => (
                        <line 
                            key={p} 
                            x1={padding} y1={padding + p * (chartHeight - padding * 2)} 
                            x2={chartWidth - padding} y2={padding + p * (chartHeight - padding * 2)} 
                            stroke="#F1F5F9" strokeWidth="1" 
                        />
                    ))}
                    
                    {/* Area */}
                    <motion.path 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        d={areaData}
                        fill={color}
                    />
                    
                    {/* Path */}
                    <motion.path 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        d={pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Points */}
                    {points.map((p, i) => (
                        <motion.circle 
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + i * 0.1 }}
                            cx={p.x} cy={p.y} r="4"
                            fill="white"
                            stroke={color}
                            strokeWidth="2"
                        />
                    ))}
                </svg>
            </div>
            <div className="flex justify-between px-2">
                {data.map((d, i) => (
                    <span key={i} className="text-[10px] font-bold text-slate-400 uppercase">{d.label}</span>
                ))}
            </div>
        </div>
    );
};

export default TrendChart;
