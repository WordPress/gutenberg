/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Clicks on the button in the header which opens Document Settings sidebar when
 * it is closed.
 *
 * @param this
 */
export async function openDocumentSettingsSidebar( this: Editor ) {
	const toggleButton = this.page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', {
			name: 'Settings',
			disabled: false,
		} );

	const isClosed =
		( await toggleButton.getAttribute( 'aria-expanded' ) ) === 'false';

	if ( isClosed ) {
		await toggleButton.click();
		await this.page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Close Settings' } )
			.waitFor();
	}
}
