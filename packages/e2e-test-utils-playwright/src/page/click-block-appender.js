/**
 * Clicks the default block appender.
 *
 * @this {import('./').PageUtils}
 */
export async function clickBlockAppender() {
	// The block appender is only visible when there's no selection.
	await this.page.evaluate( () =>
		window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock()
	);

	const appender = this.page.locator(
		'.block-editor-default-block-appender__content'
	);

	await appender.click();
}
