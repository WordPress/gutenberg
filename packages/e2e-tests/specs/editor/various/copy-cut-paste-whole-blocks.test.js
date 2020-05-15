/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	pressKeyWithModifier,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'Multi-block selection', () => {
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
} );
