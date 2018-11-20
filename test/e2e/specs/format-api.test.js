/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	newPost,
	pressWithModifier,
} from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

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
		expect( await page.$( '[aria-label="Custom Link"]' ) ).not.toBeNull();
	} );

	it( 'Clicking the control wraps the selected text properly with HTML code', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'First paragraph' );
		await pressWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressWithModifier( 'primary', 'A' );
		await page.mouse.move( 200, 300, { steps: 10 } );
		await page.click( '[aria-label="Custom Link"]' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
