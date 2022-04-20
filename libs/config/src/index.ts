const log = console.log

export const getConfig = (variableName: string) => process.env[variableName] as string | undefined

export const getConfigString = <T = undefined>(
    variableName: string,
    defaultValue?: T,
) => {
    const value = getConfig(variableName)
    if(value !== undefined) { return value; }
    log(`Configuration(${variableName}): value not provided`);
    if(defaultValue !== undefined) { log(`Configuration(${variableName}): using default value '${defaultValue}'`); }
    return defaultValue;
} 

export const getConfigUrl = <T = undefined>(
    variableName: string,
    defaultValue?: T,
) => {
    const url = getConfig(variableName)
    try {
        if(url) { return new URL(url); }
        log(`Configuration(${variableName}): value not provided`);
    } catch {
        log(`Configuration(${variableName}): provided value '${url}' does not seem to be a valid URL`);
    }
    if(defaultValue !== undefined) { log(`Configuration(${variableName}): using default value '${defaultValue}'`); }
    return defaultValue;
}
