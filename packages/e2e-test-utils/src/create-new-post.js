/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { visitAdminPage } from './visit-admin-page';

/**
 * Creates new post.
 *
 * @param {Object} obj Object to create new post, along with tips enabling option.
 */
export async function createNewPost( {
	postType,
	title,
	content,
	excerpt,
	showWelcomeGuide = false,
} = {} ) {
	const query = addQueryArgs( '', {
		post_type: postType,
		post_title: title,
		content,
		excerpt,
	} ).slice( 1 );

	await visitAdminPage( 'post-new.php', query );

	const isWelcomeGuideActive = await page.evaluate( () =>
		wp.data.select( 'core/edit-post' ).isFeatureActive( 'welcomeGuide' )
	);

	if ( showWelcomeGuide !== isWelcomeGuideActive ) {
		await page.evaluate( () =>
			wp.data.dispatch( 'core/edit-post' ).toggleFeature( 'welcomeGuide' )
		);

		await page.reload();
	}
}
