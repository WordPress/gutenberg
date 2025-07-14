/**
 * Internal dependencies
 */
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
	// Prepare experiments data as an object
	const experimentsData = Object.fromEntries(
		experiments.map( ( experiment ) => [ experiment, true ] )
	);

	// Update settings via REST API
	await this.rest( {
		path: '/wp/v2/settings',
		method: 'PUT',
		data: {
			'gutenberg-experiments': experimentsData,
		},
	} );
}

export { setGutenbergExperiments };
