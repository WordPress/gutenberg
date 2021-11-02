/**
 * Clicks a button in a placeholder based on the label text.
 *
 * @param {string} buttonText The text that appears on the button to click.
 */
export async function clickPlaceholderButton( buttonText ) {
	const _button = await page.waitForFunction(
		( text ) => {
			const placeholders = document.querySelectorAll(
				'.wp-block-editor-placeholder'
			);

			for ( const placeholder of placeholders ) {
				const buttons = placeholder.shadowRoot.querySelectorAll(
					'button,label'
				);

				for ( const button of buttons ) {
					if (
						button.textContent === text ||
						button.getAttribute( 'aria-label' ) === text
					) {
						return button;
					}
				}
			}
		},
		{},
		buttonText
	);
	await _button.click();
}
