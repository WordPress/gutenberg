/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

/**
 * Sets the Gutenberg experiments.
 *
 * @param this
 * @param experiments Array of experimental flags to enable. Pass in an empty array to disable all experiments.
 * @return Returns true if experiments were set successfully, false if Gutenberg plugin is not active.
 */
async function setGutenbergExperiments(
	this: RequestUtils,
	experiments: string[]
): Promise< boolean > {
	const response = await this.request.get(
		'/wp-admin/admin.php?page=gutenberg-experiments'
	);
	if ( response.status() !== 200 ) {
		return false;
	}
	const html = await response.text();
	const nonce = html.match( /name="_wpnonce" value="([^"]+)"/ )![ 1 ];

	await this.request.post( '/wp-admin/options.php', {
		form: {
			option_page: 'gutenberg-experiments',
			action: 'update',
			_wpnonce: nonce,
			_wp_http_referer: '/wp-admin/admin.php?page=gutenberg-experiments',
			...Object.fromEntries(
				experiments.map( ( experiment ) => [
					`gutenberg-experiments[${ experiment }]`,
					1,
				] )
			),
			submit: 'Save Changes',
		},
		failOnStatusCode: true,
	} );

	return true;
}

export { setGutenbergExperiments };
