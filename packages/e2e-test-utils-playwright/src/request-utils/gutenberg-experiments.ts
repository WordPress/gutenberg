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

	// active_templates is enabled when the option is set to an object (even empty).
	// Setting it to null disables the experiment by deleting the option.
	if ( hasActiveTemplates ) {
		settingsData.active_templates = {};
	} else {
		settingsData.active_templates = null;
	}

	await this.rest( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: settingsData,
	} );
}

export { setGutenbergExperiments };
