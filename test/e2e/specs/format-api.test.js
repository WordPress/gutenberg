/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	META_KEY,
	newPost,
	pressWithModifier,
} from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

/**
 * The modifier keys needed to invoke a 'select the next word' keyboard shortcut.
 *
 * @type {string}
 */
const SELECT_WORD_MODIFIER_KEYS = process.platform === 'darwin' ? [ 'Shift', 'Alt' ] : [ 'Shift', 'Control' ];

describe( 'Using Format API', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-format-api' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-format-api' );
	} );

	beforeEach( async () => {
		await newPost();
	} );

	it( 'Format toolbar is present in a paragraph block', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'First paragraph' );
		await page.mouse.move( 200, 300, { steps: 10 } );
		expect( await page.$( '.editor-format-toolbar' ) ).not.toBeNull();
	} );

	it( 'Clicking the control wraps the selected text properly with HTML code', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'First paragraph' );
		//await page.click( '.wp-block-paragraph', { clickCount: 3 } );
		await pressWithModifier( SELECT_WORD_MODIFIER_KEYS, 'ArrowLeft' );
		await pressWithModifier( META_KEY, 'A' );
		await page.mouse.move( 200, 300, { steps: 10 } );
		await page.click( '[aria-label="Custom Link"]' );
		const paragraphContent = await page.$eval( 'div[data-type="core/paragraph"] p', ( element ) => element.innerHTML );
		expect( paragraphContent ).toEqual( '<a href="#test" class="my-plugin-link" data-mce-selected=\"inline-boundary\">First paragraph</a>' );
	} );
} );
