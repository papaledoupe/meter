export const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (typeof value === 'undefined') {
        throw new Error(`env var ${key} must be set`)
    }
    return value;
};