/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Code', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by three backticks', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '```<?php' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/code',
				attributes: {
					content: '&lt;?php',
				},
			},
		] );
	} );

	test( 'should delete block when backspace in an empty code', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/code' } );
		await page.keyboard.type( 'a' );

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Expect code block to be deleted.
		expect( await editor.getEditedPostContent() ).toBe( '' );
	} );

	test( 'should paste plain text', async ( { editor, pageUtils } ) => {
		await editor.insertBlock( { name: 'core/code' } );

		// Test to see if HTML and white space is kept.
		pageUtils.setClipboardData( { plainText: '<img />\n\t<br>' } );

		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test.describe( 'Block transforms', () => {
		test.describe( 'FROM paragraph', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/code' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/code' );
				expect( codeBlock.attributes.content ).toBe(
					'initial content'
				);
			} );

			test( 'should preserve the metadata name attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
						metadata: {
							name: 'Custom name',
						},
					},
				} );

				await editor.transformBlockTo( 'core/code' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/code' );
				expect( codeBlock.attributes.metadata ).toMatchObject( {
					name: 'Custom name',
				} );
			} );

			test( 'should preserve the block bindings', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: {
										key: 'custom_field',
									},
								},
							},
						},
					},
				} );

				await editor.transformBlockTo( 'core/code' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/code' );
				expect( codeBlock.attributes.metadata.bindings ).toMatchObject(
					{
						content: {
							source: 'core/post-meta',
							args: {
								key: 'custom_field',
							},
						},
					}
				);
			} );
		} );

		test.describe( 'FROM HTML', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/html',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/code' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/code' );
				expect( codeBlock.attributes.content ).toBe(
					'initial content'
				);
			} );

			test( 'should preserve the metadata name attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/html',
					attributes: {
						content: 'initial content',
						metadata: {
							name: 'Custom name',
						},
					},
				} );

				await editor.transformBlockTo( 'core/code' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/code' );
				expect( codeBlock.attributes.metadata ).toMatchObject( {
					name: 'Custom name',
				} );
			} );
		} );

		test.describe( 'TO paragraph', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/code',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/paragraph' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/paragraph' );
				expect( codeBlock.attributes.content ).toBe(
					'initial content'
				);
			} );

			test( 'should preserve the metadata name attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/code',
					attributes: {
						content: 'initial content',
						metadata: {
							name: 'Custom name',
						},
					},
				} );

				await editor.transformBlockTo( 'core/paragraph' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/paragraph' );
				expect( codeBlock.attributes.metadata ).toMatchObject( {
					name: 'Custom name',
				} );
			} );

			test( 'should preserve the block bindings', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/code',
					attributes: {
						content: 'initial content',
					},
				} );

				const codeBlockClientId = await page.evaluate( () =>
					window.wp.data
						.select( 'core/block-editor' )
						.getSelectedBlockClientId()
				);
				await page.evaluate( ( clientId ) => {
					window.wp.data
						.dispatch( 'core/block-editor' )
						.updateBlockAttributes( clientId, {
							metadata: {
								bindings: {
									content: {
										source: 'core/post-meta',
										args: {
											key: 'custom_field',
										},
									},
								},
							},
						} );
				}, codeBlockClientId );
				await page.waitForFunction( ( clientId ) => {
					return window.wp.data
						.select( 'core/block-editor' )
						.getBlock( clientId )?.attributes?.metadata?.bindings
						?.content;
				}, codeBlockClientId );

				await editor.transformBlockTo( 'core/paragraph' );
				const paragraphBlock = ( await editor.getBlocks() )[ 0 ];
				expect( paragraphBlock.name ).toBe( 'core/paragraph' );
				expect(
					paragraphBlock.attributes.metadata.bindings
				).toMatchObject( {
					content: {
						source: 'core/post-meta',
						args: {
							key: 'custom_field',
						},
					},
				} );
			} );
		} );
	} );
} );
