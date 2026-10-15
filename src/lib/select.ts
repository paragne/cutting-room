export function toggled(picked: string[], id: string): string[] {
	return picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
}

/** Nothing ticked trashes the whole shoot, so the button says so. */
export function settleLabel(ticked: number, total: number): string {
	return ticked === 0 ? `Trash ${total}` : `Keep ${ticked}, trash ${total - ticked}`;
}
