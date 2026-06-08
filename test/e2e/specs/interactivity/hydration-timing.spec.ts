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

		// Create a separate post with only the async block.
		// This block dynamically imports @wordpress/interactivity on
		// DOMContentLoaded, so there are no static imports of the library.
		await utils.addPostWithBlock( 'test/hydration-timing-async', {
			alias: 'hydration-timing-async',
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
				// Add a noticeable delay to simulate slow module loading.
				await new Promise( ( resolve ) => setTimeout( resolve, 3000 ) );
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

	test( 'should hydrate when the Interactivity API is loaded asynchronously after DOMContentLoaded', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		// This test uses a block that dynamically imports @wordpress/interactivity
		// on DOMContentLoaded. Since there are no static imports of the library
		// on this page, the library will be loaded after DOMContentLoaded fires.
		// This verifies that hydration is not skipped when the library is loaded
		// after that event.
		await page.goto( utils.getLink( 'hydration-timing-async' ) );

		// Wait for the async hydration status element to be present.
		const asyncHydrationStatus = page.getByTestId(
			'async-hydration-status'
		);
		await expect( asyncHydrationStatus ).toBeVisible();

		// The async module should have loaded after DOMContentLoaded.
		const asyncModuleLoaded = page.getByTestId( 'async-module-loaded' );
		await expect( asyncModuleLoaded ).toHaveText( 'yes' );

		// Hydration should have occurred even though the library was loaded
		// after DOMContentLoaded.
		const asyncHydrated = page.getByTestId( 'async-hydrated' );
		await expect( asyncHydrated ).toHaveText( 'true' );
	} );
} );
