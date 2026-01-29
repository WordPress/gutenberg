/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'RichText deprecated onSplit', () => {
	test.beforeEach( async ( { admin, page, editor } ) => {
		await admin.createNewPost();
		await page.evaluate( () => {
			const registerBlockType = window.wp.blocks.registerBlockType;
			const { useBlockProps, RichText } = window.wp.blockEditor;
			const { createBlock, setDefaultBlockName } = window.wp.blocks;
			const el = window.wp.element.createElement;
			registerBlockType( 'core/rich-text-deprecated-on-split', {
				apiVersion: 3,
				title: 'Deprecated RichText onSplit',
				attributes: {
					value: {
						type: 'string',
						source: 'html',
						selector: 'div',
					},
				},
				edit: function Edit( {
					attributes,
					setAttributes,
					onReplace,
				} ) {
					return el( RichText, {
						...useBlockProps(),
						value: attributes.value,
						onChange( value ) {
							setAttributes( { value } );
						},
						onReplace,
						onSplit( value ) {
							return createBlock(
								'core/rich-text-deprecated-on-split',
								{ value }
							);
						},
					} );
				},
				save( { attributes } ) {
					return el( RichText.Content, { value: attributes.value } );
				},
			} );
			setDefaultBlockName( 'core/rich-text-deprecated-on-split' );
		} );
		await editor.insertBlock( {
			name: 'core/rich-text-deprecated-on-split',
		} );
	} );

	test( 'should split', async ( { page, editor } ) => {
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/rich-text-deprecated-on-split',
				attributes: {
					value: '1',
				},
			},
			{
				name: 'core/rich-text-deprecated-on-split',
				attributes: {
					value: '2',
				},
			},
		] );
	} );
} );
