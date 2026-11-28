import type { RequestUtils } from './index';

/**
 * Sets the Gutenberg experiments.
 *
 * @param this
 * @param experiments Array of experimental flags to switch on,
 *                    or a map of flags to the state to put them in.
 *                    Every other experiment returns to its default.
 */
async function setGutenbergExperiments(
	this: RequestUtils,
	experiments: string[] | Record< string, boolean >
) {
	const experimentsData: Record< string, boolean > = Array.isArray(
		experiments
	)
		? Object.fromEntries(
				experiments.map( ( experiment ) => [ experiment, true ] )
			)
		: { ...experiments };

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
