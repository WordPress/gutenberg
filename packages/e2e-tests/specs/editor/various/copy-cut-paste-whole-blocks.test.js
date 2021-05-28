/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	pressKeyWithModifier,
	getEditedPostContent,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Copy/cut/paste of whole blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should copy and paste individual blocks', async () => {
		await clickBlockAppender();
		await page.keyboard.type(
			'Here is a unique string so we can test copying.'
		);
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );

		await pressKeyWithModifier( 'primary', 'c' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'ArrowDown' );
		await pressKeyWithModifier( 'primary', 'v' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should copy blocks when non textual elements are focused  (image, spacer)', async () => {
		await insertBlock( 'Spacer' );
		// At this point the spacer wrapper should be focused.
		await pressKeyWithModifier( 'primary', 'c' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await clickBlockAppender();
		await pressKeyWithModifier( 'primary', 'v' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should cut and paste individual blocks', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'Yet another unique string.' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );

		await pressKeyWithModifier( 'primary', 'x' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'ArrowDown' );
		await pressKeyWithModifier( 'primary', 'v' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should respect inline copy when text is selected', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'First block' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second block' );
		await page.keyboard.press( 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'ArrowLeft' );
		await pressKeyWithModifier( 'shift', 'ArrowLeft' );

		await pressKeyWithModifier( 'primary', 'c' );
		await page.keyboard.press( 'ArrowRight' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Enter' );
		await pressKeyWithModifier( 'primary', 'v' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should respect inline copy in places like input fields and textareas', async () => {
		await insertBlock( 'Shortcode' );
		await page.keyboard.type( '[my-shortcode]' );
		await pressKeyWithModifier( 'shift', 'ArrowLeft' );
		await pressKeyWithModifier( 'shift', 'ArrowLeft' );

		await pressKeyWithModifier( 'primary', 'c' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Pasted: ' );
		await pressKeyWithModifier( 'primary', 'v' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
