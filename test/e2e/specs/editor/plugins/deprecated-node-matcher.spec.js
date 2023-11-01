/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Deprecated Node Matcher', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-deprecated-node-matcher'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-deprecated-node-matcher'
		);
	} );

	test( 'should insert block with node source', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/deprecated-node-matcher' } );
		await page.keyboard.type( 'test' );
		await page.keyboard.press( 'Enter' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should insert block with children source', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/deprecated-children-matcher',
		} );
		await page.keyboard.type( 'test' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeys( 'primary+b' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
