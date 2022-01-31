/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

const SELECTORS = {
	visualEditor: '.edit-site-visual-editor iframe',
};

export async function goToSiteEditor( query ) {
	query = addQueryArgs( '', {
		page: 'gutenberg-edit-site',
		...query,
	} ).slice( 1 );

	await visitAdminPage( 'themes.php', query );
	await page.waitForSelector( SELECTORS.visualEditor );
}
