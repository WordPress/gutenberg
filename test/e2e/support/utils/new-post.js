/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { visitAdmin } from './visit-admin';

export async function newPost( {
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
	await visitAdmin( 'post-new.php', query );

	await page.evaluate( ( _enableTips ) => {
		const action = _enableTips ? 'enableTips' : 'disableTips';
		wp.data.dispatch( 'core/nux' )[ action ]();
	}, enableTips );

	if ( enableTips ) {
		await page.reload();
	}
}
