/** `localDateTime` is wall-clock time stored as UTC, so format it as UTC to avoid shifting it. */
export function formatTaken(localDateTime: string): string {
	return new Date(localDateTime).toLocaleString(undefined, {
		timeZone: 'UTC',
		dateStyle: 'long',
		timeStyle: 'short'
	});
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ['KB', 'MB', 'GB'];
	let value = bytes / 1024;
	let i = 0;
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i++;
	}
	return `${value.toFixed(1)} ${units[i]}`;
}
