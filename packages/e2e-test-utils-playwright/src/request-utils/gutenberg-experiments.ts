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
 * @return `true` when experiments were applied, `false` when the Gutenberg
 *         plugin is not active (the `gutenberg-experiments` setting is only
 *         registered by the plugin).
 */
async function setGutenbergExperiments(
	this: RequestUtils,
	experiments: string[]
): Promise< boolean > {
	const currentSiteSettings = ( await this.getSiteSettings() ) as unknown as {
		'gutenberg-experiments'?: unknown;
		active_templates?: unknown;
	};
	if ( ! ( 'gutenberg-experiments' in currentSiteSettings ) ) {
		return false;
	}

	// Separate regular experiments from active_templates.
	// active_templates is stored as a separate option, not in the experiments array.
	const regularExperiments = experiments.filter(
		( exp ) => exp !== 'active_templates'
	);
	const hasActiveTemplates = experiments.includes( 'active_templates' );

	// Build the experiments object with boolean values.
	// When empty array is passed, we send an empty object to disable all experiments.
	const experimentsData: Record< string, boolean > = {};

	for ( const experiment of regularExperiments ) {
		experimentsData[ experiment ] = true;
	}

	const settingsData: Record< string, unknown > = {
		'gutenberg-experiments': experimentsData,
	};

	// active_templates lives in a separate top-level option. Sending `{}`
	// enables the experiment; sending `null` deletes the option and disables
	// it.
	if ( hasActiveTemplates ) {
		settingsData.active_templates = {};
	} else if ( currentSiteSettings.active_templates !== null ) {
		// WP_REST_Settings_Controller rejects null updates when the stored
		// value does not match the `type: 'object'` schema (including when the
		// option is absent and `get_option` falls back to `false`), so we only
		// send null when the option actually exists.
		settingsData.active_templates = null;
	}

	await this.rest( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: settingsData,
	} );

	return true;
}

export { setGutenbergExperiments };
