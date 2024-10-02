/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Switch the editor tool being used.
 *
 * @param this
 * @param label The text string of the button label.
 */
export async function switchEditorTool( this: Editor, label: string ) {
	const toolsToolbar = this.page.getByRole( 'toolbar', {
		name: 'Document tools',
	} );
	await toolsToolbar
		.getByRole( 'button', {
			name: 'Tools',
		} )
		.click();
	const menu = this.page.getByRole( 'menu', {
		name: 'Tools',
	} );
	await menu
		.getByRole( 'menuitemradio', {
			name: label,
		} )
		.click();
	await toolsToolbar
		.getByRole( 'button', {
			name: 'Tools',
		} )
		.click();
}
