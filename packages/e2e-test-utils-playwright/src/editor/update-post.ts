/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Updates the post, resolving once the request is complete (once a notice
 * is displayed).
 *
 * @param this
 */
export async function updatePost( this: Editor ) {
	await this.page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Update' } )
		.click();
	const dismissNotice = this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.filter( { hasText: 'updated' } );

	await dismissNotice.waitFor();
	await dismissNotice.click();
}
