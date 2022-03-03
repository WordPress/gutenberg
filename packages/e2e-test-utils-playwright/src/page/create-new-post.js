/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Creates new post.
 *
 * @this {import('.').PageUtils}
 * @param {Object}  object                    Object to create new post, along with tips enabling option.
 * @param {string}  [object.postType]         Post type of the new post.
 * @param {string}  [object.title]            Title of the new post.
 * @param {string}  [object.content]          Content of the new post.
 * @param {string}  [object.excerpt]          Excerpt of the new post.
 * @param {boolean} [object.showWelcomeGuide] Whether to show the welcome guide.
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

	await this.visitAdminPage( 'post-new.php', query );

	await this.page.waitForSelector( '.edit-post-layout' );

	const isWelcomeGuideActive = await this.page.evaluate( () =>
		window.wp.data
			.select( 'core/edit-post' )
			.isFeatureActive( 'welcomeGuide' )
	);
	const isFullscreenMode = await this.page.evaluate( () =>
		window.wp.data
			.select( 'core/edit-post' )
			.isFeatureActive( 'fullscreenMode' )
	);

	if ( showWelcomeGuide !== isWelcomeGuideActive ) {
		await this.page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/edit-post' )
				.toggleFeature( 'welcomeGuide' )
		);

		await this.page.reload();
		await this.page.waitForSelector( '.edit-post-layout' );
	}

	if ( isFullscreenMode ) {
		await this.page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/edit-post' )
				.toggleFeature( 'fullscreenMode' )
		);

		await this.page.waitForSelector( 'body:not(.is-fullscreen-mode)' );
	}
}
