/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { visitAdminPage } from './visit-admin-page';

/**
 * Enables experimental features from the plugin settings section.
 *
 * @param {Array} features Array of {string} selectors of settings to enable. Assumes they can be enabled with one click.
 */
export async function enableExperimentalFeatures( features ) {
	const query = addQueryArgs( '', {
		page: 'gutenberg-experiments',
	} );
	await visitAdminPage( '/admin.php', query );

	await Promise.all( features.map( async ( feature ) => {
		await page.waitForSelector( feature );
		const checkedSelector = `${ feature }[checked=checked]`;
		const isChecked = !! ( await page.$( checkedSelector ) );
		if ( ! isChecked ) {
			await page.click( feature );
		}
	} ) );
	await Promise.all( [
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
		page.click( '#submit' ),
	] );
}
