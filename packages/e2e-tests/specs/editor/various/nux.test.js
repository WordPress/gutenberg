/**
 * WordPress dependencies
 */
import {
	createNewPost,
	toggleScreenOption,
} from '@wordpress/e2e-test-utils';

describe( 'New User Experience (NUX)', () => {
	async function clickAllTips( page ) {
		// Click through all available tips.
		const tips = await getTips( page );
		const numberOfTips = tips.tipIds.length;

		for ( let i = 1; i < numberOfTips; i++ ) {
			await page.click( '.nux-dot-tip .components-button.is-link' );
		}

		return { numberOfTips, tips };
	}

	async function getTips( page ) {
		return await page.evaluate( () => {
			return wp.data.select( 'core/nux' ).getAssociatedGuide( 'core/editor.inserter' );
		} );
	}

	async function getTipsEnabled( page ) {
		return await page.evaluate( () => {
			return wp.data.select( 'core/nux' ).areTipsEnabled();
		} );
	}

	beforeEach( async () => {
		await createNewPost( { enableTips: true } );
	} );

	it( 'should show tips to a first-time user', async () => {
		const firstTipText = await page.$eval( '.nux-dot-tip', ( element ) => element.innerText );
		expect( firstTipText ).toContain( 'Welcome to the wonderful world of blocks!' );

		const [ nextTipButton ] = await page.$x( "//button[contains(text(), 'See next tip')]" );
		await nextTipButton.click();

		const secondTipText = await page.$eval( '.nux-dot-tip', ( element ) => element.innerText );
		expect( secondTipText ).toContain( 'You’ll find more settings for your page and blocks in the sidebar.' );
	} );

	it( 'should show "Got it" once all tips have been displayed', async () => {
		await clickAllTips( page );

		// Make sure "Got it" button appears on the last tip.
		const gotItButton = await page.$x( "//button[contains(text(), 'Got it')]" );
		expect( gotItButton ).toHaveLength( 1 );

		// Click the "Got it button".
		await page.click( '.nux-dot-tip .components-button.is-link' );

		// Verify no more tips are visible on the page.
		const nuxTipElements = await page.$$( '.nux-dot-tip' );
		expect( nuxTipElements ).toHaveLength( 0 );

		// Tips should not be marked as disabled, but when the user has seen all
		// of the available tips, they will not appear.
		const areTipsEnabled = await getTipsEnabled( page );
		expect( areTipsEnabled ).toEqual( true );
	} );

	it( 'should hide and disable tips if "disable tips" button is clicked', async () => {
		await page.click( '.nux-dot-tip__disable' );

		// Verify no more tips are visible on the page.
		let nuxTipElements = await page.$$( '.nux-dot-tip' );
		expect( nuxTipElements ).toHaveLength( 0 );

		// We should be disabling the tips so they don't appear again.
		const areTipsEnabled = await getTipsEnabled( page );
		expect( areTipsEnabled ).toEqual( false );

		// Refresh the page; tips should not show because they were disabled.
		await page.reload();

		nuxTipElements = await page.$$( '.nux-dot-tip' );
		expect( nuxTipElements ).toHaveLength( 0 );
	} );

	it( 'should enable tips when the "Tips" option is toggled on', async () => {
		// Start by disabling tips.
		await page.click( '.nux-dot-tip__disable' );

		// Verify no more tips are visible on the page.
		let nuxTipElements = await page.$$( '.nux-dot-tip' );
		expect( nuxTipElements ).toHaveLength( 0 );

		// Tips should be disabled in localStorage as well.
		let areTipsEnabled = await getTipsEnabled( page );
		expect( areTipsEnabled ).toEqual( false );

		// Toggle the 'Tips' option to enable.
		await toggleScreenOption( 'Tips' );

		// Tips should once again appear.
		nuxTipElements = await page.$$( '.nux-dot-tip' );
		expect( nuxTipElements ).toHaveLength( 1 );

		// Tips should be enabled in localStorage as well.
		areTipsEnabled = await getTipsEnabled( page );
		expect( areTipsEnabled ).toEqual( true );
	} );
} );
