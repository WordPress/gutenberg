/**
 * Gets the editor canvas frame.
 */
export function canvas() {
	return page.frames().find( ( f ) => f.name() === 'editor-canvas' ) || page;
}
