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

	it( 'should dismiss a single tip if X button is clicked and dialog is dismissed', async () => {
		// We need to *dismiss* the upcoming confirm() dialog, so let's temporarily
		// remove the listener that was added in by enablePageDialogAccept().
		const listeners = page.rawListeners( 'dialog' );
		page.removeAllListeners( 'dialog' );

		// Open up the inserter.
		await openGlobalBlockInserter();

		// Dismiss the upcoming confirm() dialog.
		page.once( 'dialog', async ( dialog ) => {
			await dialog.dismiss();
		} );

		// Click the tip's X button.
		await page.click( '.block-editor-inserter__tip button[aria-label="Dismiss this notice"]' );

		// The tip should be gone.
		const inserterTip = await page.$( '.block-editor-inserter__tip' );
		expect( inserterTip ).toBeNull();

		// Tips should still be enabled.
		expect( await areTipsEnabled() ).toBe( true );

		// Restore the listeners that we removed above.
		for ( const listener of listeners ) {
			page.addListener( 'dialog', listener );
		}
	} );

	it( 'should disable all tips if X button is clicked and dialog is confirmed', async () => {
		// Open up the inserter.
		await openGlobalBlockInserter();

		// Dismiss the tip. (The confirm() dialog will automatically be accepted.)
		await page.click( '.block-editor-inserter__tip button[aria-label="Dismiss this notice"]' );

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
