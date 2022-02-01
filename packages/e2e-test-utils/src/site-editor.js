/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

const SELECTORS = {
	visualEditor: '.edit-site-visual-editor iframe',
};

/**
 * Returns a promise which resolves with the edited post content (HTML string).
 *
 * @return {Promise<string>} Promise resolving with post content markup.
 */
export function getEditedPostContent() {
	return page.evaluate( () => {
		const postId = window.wp.data
			.select( 'core/edit-site' )
			.getEditedPostId();
		const postType = window.wp.data
			.select( 'core/edit-site' )
			.getEditedPostType();
		const record = window.wp.data
			.select( 'core' )
			.getEditedEntityRecord( 'postType', postType, postId );
		if ( record ) {
			if ( typeof record.content === 'function' ) {
				return record.content( record );
			} else if ( record.blocks ) {
				return window.wp.blocks.__unstableSerializeAndClean(
					record.blocks
				);
			} else if ( record.content ) {
				return record.content;
			}
		}
		return '';
	} );
}

/**
 * Visits the Site Editor main page
 *
 * @param {string} query String to be serialized as query portion of URL.
 */
export async function goToSiteEditor( query ) {
	query = addQueryArgs( '', {
		page: 'gutenberg-edit-site',
		...query,
	} ).slice( 1 );

	await visitAdminPage( 'themes.php', query );
	await page.waitForSelector( SELECTORS.visualEditor );
}
