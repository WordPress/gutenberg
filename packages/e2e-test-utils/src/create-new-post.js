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
	enableTips = false,
} = {} ) {
	const query = addQueryArgs( '', {
		post_type: postType,
		post_title: title,
		content,
		excerpt,
	} ).slice( 1 );

	await visitAdminPage( 'post-new.php', query );

	const areTipsEnabled = await page.evaluate( () => wp.data.select( 'core/nux' ).areTipsEnabled() );

	if ( enableTips !== areTipsEnabled ) {
		await page.evaluate( ( _enableTips ) => {
			const action = _enableTips ? 'enableTips' : 'disableTips';
			wp.data.dispatch( 'core/nux' )[ action ]();
		}, enableTips );

		await page.reload();
	}

	await page.emulateMediaFeatures( [ { name: 'prefers-reduced-motion', value: 'reduce' } ] );
}
