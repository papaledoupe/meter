
export function condition(description: string, asyncPredicate: () => Promise<boolean>, intervalMs: number, timeoutMs: number) {
    let interval: NodeJS.Timeout, timeout: NodeJS.Timeout;
    return Promise.race([
        new Promise((_res, rej) => {
            timeout = setTimeout(() => {
                console.log(`condition timed out after ${timeoutMs} ms: ${description}`);
                rej(new Error(`timed out awaiting condition: ${description}`));
            }, timeoutMs)
        }),
        new Promise(res => {
            let oldInterval = interval;
            interval = setInterval(() => {
                if (oldInterval) clearInterval(oldInterval);
                console.log(`testing condition: ${description}`);
                asyncPredicate().then(result => {
                    if (result) {
                        res();
                        console.log(`condition met: ${description}`);
                    }
                })
            }, intervalMs)
        })
    ]).then(() => {
        if (interval) clearInterval(interval);
        if (timeout) clearInterval(timeout);
    });
}