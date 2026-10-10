import { describe, expect, it, vi } from 'vitest';
import { shareMode } from './share';

const file = new File(['x'], 'IMG_1.jpg', { type: 'image/jpeg' });

describe('shareMode', () => {
	it('shares when the browser accepts the file', () => {
		const canShare = vi.fn(() => true);
		expect(shareMode({ share: async () => {}, canShare }, file)).toBe('share');
		expect(canShare).toHaveBeenCalledWith({ files: [file] });
	});

	it('downloads when the browser rejects the file type', () => {
		expect(shareMode({ share: async () => {}, canShare: () => false }, file)).toBe('download');
	});

	it('downloads when file sharing is unavailable, as on HTTP or desktop Firefox', () => {
		expect(shareMode({}, file)).toBe('download');
		expect(shareMode({ share: async () => {} }, file)).toBe('download');
	});
});
