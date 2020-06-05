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
 * @param {string} [obj.postType] Post type of the new post.
 * @param {string} [obj.title] Title of the new post.
 * @param {string} [obj.content] Content of the new post.
 * @param {string} [obj.excerpt] Excerpt of the new post.
 * @param {boolean} [obj.showWelcomeGuide] Whether to show the welcome guide.
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
	const isFullscreenMode = await page.evaluate( () =>
		wp.data.select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' )
	);

	if ( showWelcomeGuide !== isWelcomeGuideActive ) {
		await page.evaluate( () =>
			wp.data.dispatch( 'core/edit-post' ).toggleFeature( 'welcomeGuide' )
		);

		await page.reload();
	}

	if ( isFullscreenMode ) {
		await page.evaluate( () =>
			wp.data
				.dispatch( 'core/edit-post' )
				.toggleFeature( 'fullscreenMode' )
		);
	}
}
