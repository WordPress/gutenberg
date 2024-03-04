/**
 * Internal dependencies
 */
import type { Editor } from './index';

/**
 * Saves the post as a draft, resolving once the request is complete (once a notice
 * is displayed).
 */
export async function saveDraft( this: Editor ) {
	await this.page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Save draft' } )
		.click();

	await this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.filter( { hasText: 'Draft saved' } )
		.waitFor();
}
