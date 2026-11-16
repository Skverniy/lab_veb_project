export function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
export async function retry(fn, retries = 3) {
    try {
        return await fn();
    }
    catch (error) {
        if (retries <= 0)
            throw error;
        return retry(fn, retries - 1);
    }
}
