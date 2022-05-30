/**
 * WordPress dependencies
 */
const {
	test,
	expect,
	Editor, // toggleGlobalStyles, openGlobalStylesPanel
	Admin, // visitSiteEditor
	RequestUtils, //deleteAllPosts, activateTheme
} = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Global styles variations', () => {
	test.beforeAll( async () => {

	} );
	test.afterAll( async () => {

	} );
	test.beforeEach( async () => {

	} );

	test( 'Should have three variations available with the first one being active', async () => {} );
	test( 'Should apply preset colors and font sizes in a variation', async () => {} );
	test( 'Should apply custom colors and font sizes in a variation', async () => {} );
	test( 'Should apply a color palette in a variation', async () => {} );
	test( 'Should reflect style variations in the styles applied to the editor', async () => {} );
} );
