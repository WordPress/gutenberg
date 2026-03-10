/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

/**
 * Sets the Gutenberg experiments.
 *
 * @param this
 * @param experiments Array of experimental flags to enable. Pass in an empty array to disable all experiments.
 *                    Use 'active_templates' for the template activation feature.
 */
async function setGutenbergExperiments(
	this: RequestUtils,
	experiments: string[]
) {
	const response = await this.request.get(
		'/wp-admin/admin.php?page=gutenberg-experiments'
	);
	const html = await response.text();
	const nonce = html.match( /name="_wpnonce" value="([^"]+)"/ )![ 1 ];

	const formData: Record< string, string | number > = {
		option_page: 'gutenberg-experiments',
		action: 'update',
		_wpnonce: nonce,
		_wp_http_referer: '/wp-admin/admin.php?page=gutenberg-experiments',
		submit: 'Save Changes',
	};

	// Separate regular experiments from active_templates.
	const regularExperiments = experiments.filter(
		( exp ) => exp !== 'active_templates'
	);
	const hasActiveTemplates = experiments.includes( 'active_templates' );

	// Add regular experiments to the gutenberg-experiments array.
	if ( regularExperiments.length > 0 ) {
		Object.assign(
			formData,
			Object.fromEntries(
				regularExperiments.map( ( experiment ) => [
					`gutenberg-experiments[${ experiment }]`,
					1,
				] )
			)
		);
	}

	// Template activation uses the active_templates checkbox field.
	if ( hasActiveTemplates ) {
		formData.active_templates = 1;
	}

	await this.request.post( '/wp-admin/options.php', {
		form: formData,
		failOnStatusCode: true,
	} );
}

export { setGutenbergExperiments };
