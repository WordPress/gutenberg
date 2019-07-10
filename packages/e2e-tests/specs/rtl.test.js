/**
 * WordPress dependencies
 */
import {
	createNewPost,
	getEditedPostContent,
	pressKeyWithModifier,
	switchToEditMode,
} from '@wordpress/e2e-test-utils';

// Avoid using three, as it looks too much like two with some fonts.
const ARABIC_ZERO = '٠';
const ARABIC_ONE = '١';
const ARABIC_TWO = '٢';

describe( 'RTL', () => {
	beforeEach( async () => {
		await createNewPost();
		await switchToEditMode();
	} );

	it( 'should arrow navigate', async () => {
		await page.evaluate( () => document.dir = 'rtl' );
		await page.keyboard.press( 'Enter' );

		// We need at least three characters as arrow navigation *from* the
		// edges might be handled differently.
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.type( ARABIC_TWO );
		await page.keyboard.press( 'ArrowRight' );
		// This is the important key press: arrow nav *from* the middle.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( ARABIC_ZERO );

		// Expect: ARABIC_ZERO + ARABIC_ONE + ARABIC_TWO (<p>٠١٢</p>).
		// N.b.: HTML is LTR, so direction will be reversed!
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should split', async () => {
		await page.evaluate( () => document.dir = 'rtl' );
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( ARABIC_ZERO );
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should merge backward', async () => {
		await page.evaluate( () => document.dir = 'rtl' );
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( ARABIC_ZERO );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should merge forward', async () => {
		await page.evaluate( () => document.dir = 'rtl' );
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( ARABIC_ZERO );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Delete' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should arrow navigate between blocks', async () => {
		await page.evaluate( () => document.dir = 'rtl' );
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( ARABIC_ZERO );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ARABIC_ONE );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( ARABIC_TWO );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );

		// Move to the previous block with two lines in the current block.
		await page.keyboard.press( 'ArrowRight' );
		await pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( ARABIC_ONE );

		// Move to the next block with two lines in the current block.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( ARABIC_ZERO );
		await pressKeyWithModifier( 'shift', 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should navigate inline boundaries', async () => {
		await page.evaluate( () => document.dir = 'rtl' );
		await page.keyboard.press( 'Enter' );

		await pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( ARABIC_ONE );
		await pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( ARABIC_TWO );

		// Insert a character at each boundary position.
		for ( let i = 4; i > 0; i-- ) {
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.type( ARABIC_ZERO );

			expect( await getEditedPostContent() ).toMatchSnapshot();

			await page.keyboard.press( 'Backspace' );
		}
	} );
} );
