/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block transforms', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.describe( 'Code block', () => {
		test( 'should convert to a preformatted block', async ( {
			page,
			editor,
		} ) => {
			const code = 'print "Hello Dolly!"';

			await editor.insertBlock( { name: 'core/code' } );
			await page.keyboard.type( code );

			// Verify the content starts out as a Code block.

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:code -->
<pre class="wp-block-code"><code>${ code }</code></pre>
<!-- /wp:code -->` );

			await editor.transformBlockTo( 'core/preformatted' );

			// The content should now be a Preformatted block with no data loss.
			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:preformatted -->
<pre class="wp-block-preformatted">${ code }</pre>
<!-- /wp:preformatted -->` );
		} );
	} );

	test.describe( 'Heading block', () => {
		test.describe( 'FROM paragraph', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/heading' );
				const headingBlock = ( await editor.getBlocks() )[ 0 ];
				expect( headingBlock.name ).toBe( 'core/heading' );
				expect( headingBlock.attributes.content ).toBe(
					'initial content'
				);
			} );

			test( 'should preserve the text align attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						align: 'right',
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/heading' );
				const headingBlock = ( await editor.getBlocks() )[ 0 ];
				expect( headingBlock.name ).toBe( 'core/heading' );
				expect( headingBlock.attributes.textAlign ).toBe( 'right' );
			} );

			test( 'should preserve the metadata attribute', async ( {
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

				await editor.transformBlockTo( 'core/heading' );
				const headingBlock = ( await editor.getBlocks() )[ 0 ];
				expect( headingBlock.name ).toBe( 'core/heading' );
				expect( headingBlock.attributes.metadata ).toMatchObject( {
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

				await editor.transformBlockTo( 'core/heading' );
				const headingBlock = ( await editor.getBlocks() )[ 0 ];
				expect( headingBlock.name ).toBe( 'core/heading' );
				expect(
					headingBlock.attributes.metadata.bindings
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

		test.describe( 'TO paragraph', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/heading',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/paragraph' );
				const paragraphBlock = ( await editor.getBlocks() )[ 0 ];
				expect( paragraphBlock.name ).toBe( 'core/paragraph' );
				expect( paragraphBlock.attributes.content ).toBe(
					'initial content'
				);
			} );

			test( 'should preserve the text align attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/heading',
					attributes: {
						textAlign: 'right',
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/paragraph' );
				const paragraphBlock = ( await editor.getBlocks() )[ 0 ];
				expect( paragraphBlock.name ).toBe( 'core/paragraph' );
				expect( paragraphBlock.attributes.align ).toBe( 'right' );
			} );

			test( 'should preserve the metadata attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/heading',
					attributes: {
						content: 'initial content',
						metadata: {
							name: 'Custom name',
						},
					},
				} );

				await editor.transformBlockTo( 'core/paragraph' );
				const paragraphBlock = ( await editor.getBlocks() )[ 0 ];
				expect( paragraphBlock.name ).toBe( 'core/paragraph' );
				expect( paragraphBlock.attributes.metadata ).toMatchObject( {
					name: 'Custom name',
				} );
			} );

			test( 'should preserve the block bindings', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/heading',
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

	test.describe( 'Button block', () => {
		test.describe( 'FROM paragraph', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/buttons' );
				const buttonBlock = ( await editor.getBlocks() )[ 0 ]
					.innerBlocks[ 0 ];
				expect( buttonBlock.name ).toBe( 'core/button' );
				expect( buttonBlock.attributes.text ).toBe( 'initial content' );
			} );

			test( 'should preserve the metadata attribute', async ( {
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

				await editor.transformBlockTo( 'core/buttons' );
				const buttonBlock = ( await editor.getBlocks() )[ 0 ]
					.innerBlocks[ 0 ];
				expect( buttonBlock.name ).toBe( 'core/button' );
				expect( buttonBlock.attributes.metadata ).toMatchObject( {
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

				await editor.transformBlockTo( 'core/buttons' );
				const buttonBlock = ( await editor.getBlocks() )[ 0 ]
					.innerBlocks[ 0 ];
				expect( buttonBlock.name ).toBe( 'core/button' );
				expect(
					buttonBlock.attributes.metadata.bindings
				).toMatchObject( {
					text: {
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
