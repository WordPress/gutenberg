/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import { visitAdminPage } from '@wordpress/e2e-test-utils';

async function setExperimentalFeaturesState( features, enable ) {
	const query = addQueryArgs( '', {
		page: 'gutenberg-experiments',
	} );
	await visitAdminPage( '/admin.php', query );

	await Promise.all(
		features.map( async ( feature ) => {
			await page.waitForSelector( feature );
			const checkedSelector = `${ feature }[checked=checked]`;
			const isChecked = !! ( await page.$( checkedSelector ) );
			if ( ( ! isChecked && enable ) || ( isChecked && ! enable ) ) {
				await page.click( feature );
			}
		} )
	);
	await Promise.all( [
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
		page.click( '#submit' ),
	] );
}

/**
 * Establishes test lifecycle to enable experimental feature for the duration of
 * the grouped test block.
 *
 * @param {Array} features Array of {string} selectors of settings to enable.
 *                         Assumes they can be enabled with one click.
 */
export function useExperimentalFeatures( features ) {
	beforeAll( () => setExperimentalFeaturesState( features, true ) );
	afterAll( () => setExperimentalFeaturesState( features, false ) );
}
