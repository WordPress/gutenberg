/**
 * Gets the editor canvas frame.
 *
 * @this {import('./').PageUtils}
 */
export function canvas() {
	return (
		this.page.frames().find( ( f ) => f.name() === 'editor-canvas' ) ||
		this.page
	);
}
