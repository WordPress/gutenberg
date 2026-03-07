/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Clipboard (useCopyToClipboard)', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();

		await page.evaluate( () => {
			const registerBlockType = window.wp.blocks.registerBlockType;
			const { createElement, useState } = window.wp.element;
			const { useBlockProps } = window.wp.blockEditor;
			const { useCopyToClipboard } = window.wp.compose;

			registerBlockType( 'test/copy-button-block', {
				apiVersion: 3,
				title: 'Copy Button Block',
				category: 'text',
				edit: function Edit() {
					const [ hasCopied, setHasCopied ] = useState( false );
					const ref = useCopyToClipboard( 'Test Text', () => {
						setHasCopied( true );
					} );
					return createElement(
						'div',
						useBlockProps(),
						createElement(
							'button',
							{
								ref,
								type: 'button',
							},
							hasCopied ? 'Copied!' : 'Copy'
						)
					);
				},
				save: () => null,
			} );
		} );
	} );

	test( 'should copy text to clipboard and show Copied when copy button is clicked', async ( {
		editor,
		page,
		context,
	} ) => {
		await context.grantPermissions( [
			'clipboard-read',
			'clipboard-write',
		] );

		await editor.insertBlock( { name: 'test/copy-button-block' } );

		const copyButton = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Copy Button Block',
			} )
			.getByRole( 'button' );
		await copyButton.click();
		await expect( copyButton ).toHaveText( 'Copied!' );

		const clipboardText = await page.evaluate( async () => {
			return await window.navigator.clipboard.readText();
		} );
		expect( clipboardText ).toBe( 'Test Text' );
	} );
} );
