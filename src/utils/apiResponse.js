export const unwrapApiData = (response) => {
    if (response && typeof response === 'object' && 'data' in response) {
        return response.data;
    }
    return response;
};

export const normalizeArrayResponse = (response, possibleKeys = []) => {
    if (Array.isArray(response)) return response;

    const data = unwrapApiData(response);
    if (Array.isArray(data)) return data;

    const candidates = [response, data, data?.data].filter(Boolean);
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        for (const key of possibleKeys) {
            if (Array.isArray(candidate?.[key])) return candidate[key];
        }
    }

    return [];
};

export const normalizeObjectResponse = (response, possibleKeys = []) => {
    const data = unwrapApiData(response);
    const candidates = [data, response, data?.data].filter(Boolean);

    for (const candidate of candidates) {
        if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
            for (const key of possibleKeys) {
                if (candidate[key] && typeof candidate[key] === 'object' && !Array.isArray(candidate[key])) {
                    return candidate[key];
                }
            }
            return candidate;
        }
    }

    return {};
};

export const sameApiId = (left, right) => String(left ?? '') === String(right ?? '');

export const entityValue = (entity, keys = ['value', 'id']) => {
    for (const key of keys) {
        if (entity?.[key] !== undefined && entity?.[key] !== null && entity?.[key] !== '') {
            return entity[key];
        }
    }
    return '';
};
