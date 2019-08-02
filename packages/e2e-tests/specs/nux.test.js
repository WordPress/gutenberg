/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	openGlobalBlockInserter,
	toggleScreenOption,
} from '@wordpress/e2e-test-utils';

/**
 * Queries the data store and returns whether or not NUX tips are enabled.
 *
 * @return {boolean} Whether or not NUX tips are enabled.
 */
async function areTipsEnabled() {
	return await page.evaluate( () => wp.data.select( 'core/nux' ).areTipsEnabled() );
}

describe( 'New User Experience (NUX)', () => {
	beforeEach( async () => {
		await createNewPost( { enableTips: true } );
	} );

	it( 'should show a tip in the inserter', async () => {
		// Open up the inserter.
		await openGlobalBlockInserter();

		// Check there's a tip in the inserter.
		const inserterTip = await page.$( '.block-editor-inserter__tip' );
		expect( inserterTip ).not.toBeNull();
	} );

	it( 'should show a tip in the block inspector', async () => {
		// Insert any old block.
		await insertBlock( 'Paragraph' );

		// Check there's a tip in the block inspector.
		const blockInspectorTip = await page.$( '.block-editor-block-inspector__tip' );
		expect( blockInspectorTip ).not.toBeNull();
	} );

	it( 'should dismiss a single tip if X button is clicked and confirmation is dismissed', async () => {
		// Open up the inserter.
		await openGlobalBlockInserter();

		// Click the tip's X button.
		await page.click( '.block-editor-inserter__tip button[aria-label="Dismiss this notice"]' );

		// Dismiss the confirmation modal.
		const [ noButton ] = await page.$x( '//*[contains(@class, "nux-hide-tips-confirmation")]//button[text()="No"]' );
		await noButton.click();

		// The tip should be gone.
		const inserterTip = await page.$( '.block-editor-inserter__tip' );
		expect( inserterTip ).toBeNull();

		// Tips should still be enabled.
		expect( await areTipsEnabled() ).toBe( true );
	} );

	it( 'should disable all tips if X button is clicked and confirmation is confirmed', async () => {
		// Open up the inserter.
		await openGlobalBlockInserter();

		// Click the tip's X button.
		await page.click( '.block-editor-inserter__tip button[aria-label="Dismiss this notice"]' );

		// Accept the confirmation modal.
		const [ disableTipsButton ] = await page.$x( '//*[contains(@class, "nux-hide-tips-confirmation")]//button[text()="Disable Tips"]' );
		await disableTipsButton.click();

		// The tip should be gone.
		const inserterTip = await page.$( '.block-editor-inserter__tip' );
		expect( inserterTip ).toBeNull();

		// Tips should now be disabled.
		expect( await areTipsEnabled() ).toBe( false );
	} );

	it( 'should enable and disable tips when option is toggled', async () => {
		// Toggling the option off should disable tips.
		await toggleScreenOption( 'Enable Tips', false );
		expect( await areTipsEnabled() ).toBe( false );

		// Toggling the option on should enable tips.
		await toggleScreenOption( 'Enable Tips', true );
		expect( await areTipsEnabled() ).toBe( true );
	} );
} );
