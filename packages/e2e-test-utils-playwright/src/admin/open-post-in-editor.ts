/**
 * Internal dependencies
 */
import type { Admin } from './index';

/**
 * Opens the specified post in the block editor.
 *
 * @param postName The name of the post to open.
 * @param postType The type of post to open.
 */
export async function openPostInEditor(
	this: Admin,
	postName: string,
	postType = 'post'
) {
	await this.page.goto(
		`/wp-admin/edit.php?post_type=${ postType }&s=${ encodeURIComponent(
			postName
		) }`
	);

	// This is the link to the edit page of the block, this is the page's title.
	await this.page
		.getByRole( 'link', { name: `“${ postName }” (Edit)` } )
		.click();

	await this.page.waitForLoadState( 'networkidle' );
}
