/**
 * Moves focus to the selected block.
 *
 * @this {import('./').PageUtils}
 */
export async function focusSelectedBlock() {
	// Ideally there shouuld be a UI way to do this. (Focus the selected block)
	await this.page.evaluate( () => {
		window.wp.data
			.dispatch( 'core/block-editor' )
			.selectBlock(
				window.wp.data
					.select( 'core/block-editor' )
					.getSelectedBlockClientId(),
				0
			);
	} );
}
