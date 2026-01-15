/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'hydration timing', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		// Create a post with both blocks using a core/group wrapper.
		// The "fast" block's module loads immediately, while the "slow"
		// block's module will be delayed in the test to simulate slow
		// network conditions.
		await utils.addPostWithBlock( 'core/group', {
			alias: 'hydration-timing',
			innerBlocks: [
				[ 'test/hydration-timing' ],
				[ 'test/hydration-timing-slow' ],
			],
		} );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should wait for all static imports before hydrating even with delayed module loading', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		// Delay only the "slow" module to simulate slow network conditions.
		// The "fast" module loads immediately and imports @wordpress/interactivity,
		// which could trigger hydration before the slow module finishes loading.
		await page.route(
			/hydration-timing-slow\/view\.js/,
			async ( route ) => {
				// Add a 500ms delay to simulate slow module loading.
				await new Promise( ( resolve ) => setTimeout( resolve, 500 ) );
				await route.continue();
			}
		);

		await page.goto( utils.getLink( 'hydration-timing' ) );

		// Wait for the hydration status elements to be present.
		const fastHydrationStatus = page.getByTestId( 'hydration-status' );
		await expect( fastHydrationStatus ).toBeVisible();

		const slowHydrationStatus = page.getByTestId( 'slow-hydration-status' );
		await expect( slowHydrationStatus ).toBeVisible();

		// Ensure both modules have loaded.
		const moduleLoaded = page.getByTestId( 'module-loaded' );
		const slowModuleLoaded = page.getByTestId( 'slow-module-loaded' );
		await expect( moduleLoaded ).toHaveText( 'yes' );
		await expect( slowModuleLoaded ).toHaveText( 'yes' );

		// Both init callbacks should have run during hydration.
		const contextInitialized = page.getByTestId( 'context-initialized' );
		const slowContextInitialized = page.getByTestId(
			'slow-context-initialized'
		);
		await expect( contextInitialized ).toHaveText( 'true' );
		await expect( slowContextInitialized ).toHaveText( 'true' );
	} );
} );
