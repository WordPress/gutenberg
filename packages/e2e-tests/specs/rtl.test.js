/**
 * WordPress dependencies
 */
import {
	createNewPost,
	getEditedPostContent,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

// Avoid using three, as it looks too much like two with some fonts.
const ARABIC_ZERO = '٠';
const ARABIC_ONE = '١';
const ARABIC_TWO = '٢';

describe( 'RTL', () => {
	beforeEach( async () => {
		await createNewPost();
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
} );
