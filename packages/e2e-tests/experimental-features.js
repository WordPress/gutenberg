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
 * Enables experimental features from the plugin settings section.
 *
 * @param {Array} features Array of {string} selectors of settings to enable. Assumes they can be enabled with one click.
 */
export async function enableExperimentalFeatures( features ) {
	await setExperimentalFeaturesState( features, true );
}

/**
 * Disables experimental features from the plugin settings section.
 *
 * @param {Array} features Array of {string} selectors of settings to disable. Assumes they can be disabled with one click.
 */
export async function disableExperimentalFeatures( features ) {
	await setExperimentalFeaturesState( features, false );
}
