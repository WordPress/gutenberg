/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'RichText deprecated multiline', () => {
	test.beforeEach( async ( { admin, page, editor } ) => {
		await admin.createNewPost();
		await page.evaluate( () => {
			const registerBlockType = window.wp.blocks.registerBlockType;
			const { useBlockProps, RichText } = window.wp.blockEditor;
			const el = window.wp.element.createElement;
			registerBlockType( 'core/rich-text-deprecated-multiline', {
				apiVersion: 3,
				title: 'Deprecated RichText multiline',
				attributes: {
					value: {
						type: 'string',
						source: 'html',
						selector: 'blockquote',
					},
				},
				edit: function Edit( { attributes, setAttributes } ) {
					return el( RichText, {
						...useBlockProps(),
						tagName: 'blockquote',
						multiline: 'p',
						value: attributes.value,
						onChange( value ) {
							setAttributes( { value } );
						},
					} );
				},
				save( { attributes } ) {
					return el( RichText.Content, {
						tagName: 'blockquote',
						multiline: 'p',
						value: attributes.value,
					} );
				},
			} );
		} );
		await editor.insertBlock( {
			name: 'core/rich-text-deprecated-multiline',
		} );
		await page.keyboard.press( 'ArrowDown' );
	} );

	test( 'should save', async ( { page, editor } ) => {
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/rich-text-deprecated-multiline',
				attributes: {
					value: '<p>1</p><p>2</p>',
				},
			},
		] );

		// Test serialised output.
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:rich-text-deprecated-multiline -->
<blockquote><p>1</p><p>2</p></blockquote>
<!-- /wp:rich-text-deprecated-multiline -->`
		);
	} );

	test( 'should split in middle', async ( { page, editor } ) => {
		await page.keyboard.type( '12' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );
		// Test selection after split.
		await page.keyboard.type( '‸' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/rich-text-deprecated-multiline',
				attributes: {
					value: '<p>1</p><p>‸2</p>',
				},
			},
		] );
	} );

	test( 'should merge two lines', async ( { page, editor } ) => {
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );
		// Test selection after merge.
		await page.keyboard.type( '‸' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/rich-text-deprecated-multiline',
				attributes: {
					value: '<p>1‸2</p>',
				},
			},
		] );
	} );

	test( 'should merge two lines (forward)', async ( { page, editor } ) => {
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Delete' );
		// Test selection after merge.
		await page.keyboard.type( '‸' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/rich-text-deprecated-multiline',
				attributes: {
					value: '<p>1‸2</p>',
				},
			},
		] );
	} );
} );
