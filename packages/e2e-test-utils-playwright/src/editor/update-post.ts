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
	await this.page.click( 'role=button[name="Update"i]' );

	await this.page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.filter( { hasText: 'updated' } )
		.waitFor();
	const postId = new URL( this.page.url() ).searchParams.get( 'post' );

	return typeof postId === 'string' ? parseInt( postId, 10 ) : null;
}
