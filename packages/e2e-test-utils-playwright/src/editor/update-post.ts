/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Publishes the post, resolving once the request is complete (once a notice
 * is displayed).
 *
 * @param this
 */
export async function updatePost( this: Editor ) {
	const updateButton = this.page.getByRole( 'button', {
		name: 'Update',
	} );
	await updateButton.click();

	await this.page
		.getByRole( 'button', {
			name: 'Update',
		} )
		.waitFor();
}
