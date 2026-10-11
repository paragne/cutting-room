type Box = { left: number; top: number; width: number; height: number };

/** Whether a click landed on the photo itself, not the matte around an object-fit: contain image. */
export function insidePhoto(
	click: { x: number; y: number },
	box: Box,
	natural: { width: number; height: number }
): boolean {
	if (natural.width === 0 || natural.height === 0) return true;
	const scale = Math.min(box.width / natural.width, box.height / natural.height);
	const width = natural.width * scale;
	const height = natural.height * scale;
	const left = box.left + (box.width - width) / 2;
	const top = box.top + (box.height - height) / 2;
	return click.x >= left && click.x <= left + width && click.y >= top && click.y <= top + height;
}

const SWIPE_MIN = 50;

/** +1 for the next photo (swipe left), -1 for the previous, 0 when the drag was not a horizontal swipe. */
export function swipeStep(dx: number, dy: number): -1 | 0 | 1 {
	if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
	return dx < 0 ? 1 : -1;
}
