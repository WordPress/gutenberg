/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Paragraph', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllMedia(),
		] );
	} );

	test( 'should output unwrapped editable paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( '1' );

		const firstBlockTagName = await page.evaluate( () => {
			return document.querySelector(
				'.block-editor-block-list__layout .wp-block'
			).tagName;
		} );

		// The outer element should be a paragraph. Blocks should never have any
		// additional div wrappers so the markup remains simple and easy to
		// style.
		expect( firstBlockTagName ).toBe( 'P' );
	} );

	test( 'should allow dropping an image on en empty paragraph block', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		const emptyParagraphBlock = page.locator(
			'[data-type="core/paragraph"]'
		);

		const testImageName = '10x10_e2e_test_image_z9T8jK.png';
		const testImagePath = path.join(
			__dirname,
			'../../../assets',
			testImageName
		);

		const { dragTo, drop } = await pageUtils.dragFiles( testImagePath );

		const { x, y, width, height } = await emptyParagraphBlock.boundingBox();
		const centerPosition = {
			x: x + width / 2,
			y: y + height / 2,
		};

		await dragTo( centerPosition.x, centerPosition.y );

		await expect(
			page.locator( 'text="Drop files to upload"' )
		).toBeVisible();

		await drop();

		const imageBlock = page.locator(
			'role=document[name="Block: Image"i]'
		);
		await expect( imageBlock ).toBeVisible();
		await expect( imageBlock.locator( 'role=img' ) ).toHaveAttribute(
			'src',
			new RegExp( testImageName.replace( '.', '\\.' ) )
		);
	} );
} );
