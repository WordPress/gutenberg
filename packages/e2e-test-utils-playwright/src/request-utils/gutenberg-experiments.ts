import type { RequestUtils } from './index';

/**
 * Sets the Gutenberg experiments.
 *
 * @param this
 * @param experiments Array of experimental flags to enable. Pass in an empty array to disable all experiments.
 */
async function setGutenbergExperiments(
	this: RequestUtils,
	experiments: string[]
) {
	// Build the experiments object with boolean values.
	// When empty array is passed, we send an empty object to disable all experiments.
	const experimentsData: Record< string, boolean > = {};

	for ( const experiment of experiments ) {
		experimentsData[ experiment ] = true;
	}

	// When the run targets the extensible site editor, its experiment must
	// survive specs that toggle experiments for their own feature under test
	// and reset with an empty array, since this method replaces the whole
	// `gutenberg-experiments` option.
	if ( process.env.GUTENBERG_E2E_SITE_EDITOR_V2 ) {
		experimentsData[ 'gutenberg-extensible-site-editor' ] = true;
	}

	await this.rest( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: {
			'gutenberg-experiments': experimentsData,
		},
	} );
}

export { setGutenbergExperiments };
