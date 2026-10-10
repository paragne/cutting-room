type ShareNavigator = Pick<Navigator, 'canShare' | 'share'>;

export type ShareMode = 'share' | 'download';

/** The share sheet only takes files where the browser says it can, which needs HTTPS. */
export function shareMode(nav: Partial<ShareNavigator>, file: File): ShareMode {
	return typeof nav.share === 'function' && nav.canShare?.({ files: [file] }) === true
		? 'share'
		: 'download';
}

function download(file: File): void {
	const url = URL.createObjectURL(file);
	const link = document.createElement('a');
	link.href = url;
	link.download = file.name;
	link.click();
	URL.revokeObjectURL(url);
}

/** Resolves false when the user dismisses the share sheet. */
export async function shareOrDownload(file: File): Promise<boolean> {
	if (shareMode(navigator, file) === 'download') {
		download(file);
		return true;
	}
	try {
		await navigator.share({ files: [file] });
		return true;
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') return false;
		throw err;
	}
}
