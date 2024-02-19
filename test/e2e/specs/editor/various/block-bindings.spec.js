/**
 * External dependencies
 */
const path = require( 'path' );
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block bindings', () => {
	let imagePlaceholderSrc;
	let imageCustomFieldSrc;
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
		await requestUtils.deleteAllMedia();
		const placeholderMedia = await requestUtils.uploadMedia(
			path.join( './test/e2e/assets', '10x10_e2e_test_image_z9T8jK.png' )
		);
		imagePlaceholderSrc = placeholderMedia.source_url;
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.use( {
		BlockBindingsUtils: async ( { editor, page, pageUtils }, use ) => {
			await use( new BlockBindingsUtils( { editor, page, pageUtils } ) );
		},
	} );

	test.describe( 'Template context', () => {
		test.beforeEach( async ( { admin, editor } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//index',
				postType: 'wp_template',
			} );
			await editor.canvas.locator( 'body' ).click();
			await editor.openDocumentSettingsSidebar();
		} );

		test.describe( 'Paragraph', () => {
			test( 'Should show the value of the custom field', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'paragraph default content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await expect( paragraphBlock ).toHaveText(
					'text_custom_field'
				);
			} );

			test( 'Should lock the appropriate controls with a registered source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'paragraph default content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await paragraphBlock.click();

				// Alignment controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Align text' } )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Bold',
						} )
				).toBeHidden();

				// Paragraph is not editable.
				await expect( paragraphBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);
			} );

			test( 'Should lock the appropriate controls when source is not defined', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'paragraph default content',
						metadata: {
							bindings: {
								content: {
									source: 'plugin/undefined-source',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await paragraphBlock.click();

				// Alignment controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Align text' } )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Bold',
						} )
				).toBeHidden();

				// Paragraph is not editable.
				await expect( paragraphBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);
			} );
		} );

		test.describe( 'Heading', () => {
			test( 'Should show the key of the custom field', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/heading',
					attributes: {
						content: 'heading default content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const headingBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Heading',
				} );
				await expect( headingBlock ).toHaveText( 'text_custom_field' );
			} );

			test( 'Should lock the appropriate controls with a registered source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/heading',
					attributes: {
						content: 'heading default content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const headingBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Heading',
				} );
				await headingBlock.click();

				// Alignment controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Align text' } )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Bold',
						} )
				).toBeHidden();

				// Heading is not editable.
				await expect( headingBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);
			} );

			test( 'Should lock the appropriate controls when source is not defined', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/heading',
					attributes: {
						content: 'heading default content',
						metadata: {
							bindings: {
								content: {
									source: 'plugin/undefined-source',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const headingBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Heading',
				} );
				await headingBlock.click();

				// Alignment controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Align text' } )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Bold',
						} )
				).toBeHidden();

				// Heading is not editable.
				await expect( headingBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);
			} );
		} );

		test.describe( 'Button', () => {
			test( 'Should show the key of the custom field when text is bound', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: {
								text: 'button default text',
								url: '#default-url',
								metadata: {
									bindings: {
										text: {
											source: 'core/post-meta',
											args: { key: 'text_custom_field' },
										},
									},
								},
							},
						},
					],
				} );
				const buttonBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Button',
					exact: true,
				} );
				await expect( buttonBlock ).toHaveText( 'text_custom_field' );
			} );

			test( 'Should lock text controls when text is bound to a registered source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: {
								text: 'button default text',
								url: '#default-url',
								metadata: {
									bindings: {
										text: {
											source: 'core/post-meta',
											args: { key: 'text_custom_field' },
										},
									},
								},
							},
						},
					],
				} );
				const buttonBlock = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Button',
						exact: true,
					} )
					.getByRole( 'textbox' );
				await buttonBlock.click();

				// Alignment controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Align text' } )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Bold',
						} )
				).toBeHidden();

				// Button is not editable.
				await expect( buttonBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);

				// Link controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Unlink' } )
				).toBeVisible();
			} );

			test( 'Should lock text controls when text is bound to an undefined source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: {
								text: 'button default text',
								url: '#default-url',
								metadata: {
									bindings: {
										text: {
											source: 'plugin/undefined-source',
											args: { key: 'text_custom_field' },
										},
									},
								},
							},
						},
					],
				} );
				const buttonBlock = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Button',
						exact: true,
					} )
					.getByRole( 'textbox' );
				await buttonBlock.click();

				// Alignment controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Align text' } )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Bold',
						} )
				).toBeHidden();

				// Button is not editable.
				await expect( buttonBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);

				// Link controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Unlink' } )
				).toBeVisible();
			} );

			test( 'Should lock url controls when url is bound to a registered source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: {
								text: 'button default text',
								url: '#default-url',
								metadata: {
									bindings: {
										url: {
											source: 'core/post-meta',
											args: { key: 'url_custom_field' },
										},
									},
								},
							},
						},
					],
				} );
				const buttonBlock = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Button',
						exact: true,
					} )
					.getByRole( 'textbox' );
				await buttonBlock.click();

				// Format controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Bold',
						} )
				).toBeVisible();

				// Button is editable.
				await expect( buttonBlock ).toHaveAttribute(
					'contenteditable',
					'true'
				);

				// Link controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Link' } )
				).toBeHidden();
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Unlink' } )
				).toBeHidden();
			} );

			test( 'Should lock url controls when url is bound to an undefined source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: {
								text: 'button default text',
								url: '#default-url',
								metadata: {
									bindings: {
										url: {
											source: 'plugin/undefined-source',
											args: { key: 'url_custom_field' },
										},
									},
								},
							},
						},
					],
				} );
				const buttonBlock = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Button',
						exact: true,
					} )
					.getByRole( 'textbox' );
				await buttonBlock.click();

				// Format controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Bold',
						} )
				).toBeVisible();

				// Button is editable.
				await expect( buttonBlock ).toHaveAttribute(
					'contenteditable',
					'true'
				);

				// Link controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Link' } )
				).toBeHidden();
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Unlink' } )
				).toBeHidden();
			} );

			test( 'Should lock url and text controls when both are bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: {
								text: 'button default text',
								url: '#default-url',
								metadata: {
									bindings: {
										text: {
											source: 'core/post-meta',
											args: { key: 'text_custom_field' },
										},
										url: {
											source: 'core/post-meta',
											args: { key: 'url_custom_field' },
										},
									},
								},
							},
						},
					],
				} );
				const buttonBlock = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Button',
						exact: true,
					} )
					.getByRole( 'textbox' );
				await buttonBlock.click();

				// Alignment controls are visible.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Align text' } )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Bold',
						} )
				).toBeHidden();

				// Button is not editable.
				await expect( buttonBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);

				// Link controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Link' } )
				).toBeHidden();
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Unlink' } )
				).toBeHidden();
			} );
		} );

		test.describe( 'Image', () => {
			test( 'Should show the upload form when url is not bound', async ( {
				editor,
			} ) => {
				await editor.insertBlock( { name: 'core/image' } );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();
				await expect(
					imageBlock.getByRole( 'button', { name: 'Upload' } )
				).toBeVisible();
			} );

			test( 'Should NOT show the upload form when url is bound to a registered source', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								url: {
									source: 'core/post-meta',
									args: { key: 'url_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();
				await expect(
					imageBlock.getByRole( 'button', { name: 'Upload' } )
				).toBeHidden();
			} );

			test( 'Should NOT show the upload form when url is bound to an undefined source', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								url: {
									source: 'plugin/undefined-source',
									args: { key: 'url_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();
				await expect(
					imageBlock.getByRole( 'button', { name: 'Upload' } )
				).toBeHidden();
			} );

			test( 'Should lock url controls when url is bound to a registered source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								url: {
									source: 'core/post-meta',
									args: { key: 'url_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Replace',
						} )
				).toBeHidden();

				// Image placeholder doesn't show the upload button.
				await expect(
					imageBlock.getByRole( 'button', { name: 'Upload' } )
				).toBeHidden();

				// Alt textarea is enabled and with the original value.
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Alternative text' )
				).toBeEnabled();
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'default alt value' );

				// Title input is enabled and with the original value.
				await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'button', { name: 'Advanced' } )
					.click();

				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Title attribute' )
				).toBeEnabled();
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'default title value' );
			} );

			test( 'Should lock url controls when url is bound to an undefined source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								url: {
									source: 'plugin/undefined-source',
									args: { key: 'url_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Replace',
						} )
				).toBeHidden();

				// Image placeholder doesn't show the upload button.
				await expect(
					imageBlock.getByRole( 'button', { name: 'Upload' } )
				).toBeHidden();

				// Alt textarea is enabled and with the original value.
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Alternative text' )
				).toBeEnabled();
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'default alt value' );

				// Title input is enabled and with the original value.
				await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'button', { name: 'Advanced' } )
					.click();

				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Title attribute' )
				).toBeEnabled();
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'default title value' );
			} );

			test( 'Should disable alt textarea when alt is bound to a registered source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								alt: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Replace',
						} )
				).toBeVisible();

				// Alt textarea is disabled and with the custom field value.
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Alternative text' )
				).toHaveAttribute( 'readonly' );
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'text_custom_field' );

				// Title input is enabled and with the original value.
				await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'button', { name: 'Advanced' } )
					.click();
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Title attribute' )
				).toBeEnabled();
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'default title value' );
			} );

			test( 'Should disable alt textarea when alt is bound to an undefined source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								alt: {
									source: 'plguin/undefined-source',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Replace',
						} )
				).toBeVisible();

				// Alt textarea is disabled and with the custom field value.
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Alternative text' )
				).toHaveAttribute( 'readonly' );
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'default alt value' );

				// Title input is enabled and with the original value.
				await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'button', { name: 'Advanced' } )
					.click();
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Title attribute' )
				).toBeEnabled();
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'default title value' );
			} );

			test( 'Should disable title input when title is bound to a registered source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								title: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Replace',
						} )
				).toBeVisible();

				// Alt textarea is enabled and with the original value.
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Alternative text' )
				).toBeEnabled();
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'default alt value' );

				// Title input is disabled and with the custom field value.
				await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'button', { name: 'Advanced' } )
					.click();
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Title attribute' )
				).toHaveAttribute( 'readonly' );
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'text_custom_field' );
			} );

			test( 'Should disable title input when title is bound to an undefined source', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								title: {
									source: 'plugin/undefined-source',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Replace',
						} )
				).toBeVisible();

				// Alt textarea is enabled and with the original value.
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Alternative text' )
				).toBeEnabled();
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'default alt value' );

				// Title input is disabled and with the custom field value.
				await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'button', { name: 'Advanced' } )
					.click();
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Title attribute' )
				).toHaveAttribute( 'readonly' );
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'default title value' );
			} );

			test( 'Multiple bindings should lock the appropriate controls', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								url: {
									source: 'core/post-meta',
									args: { key: 'url_custom_field' },
								},
								alt: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls don't exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', {
							name: 'Replace',
						} )
				).toBeHidden();

				// Image placeholder doesn't show the upload button.
				await expect(
					imageBlock.getByRole( 'button', { name: 'Upload' } )
				).toBeHidden();

				// Alt textarea is disabled and with the custom field value.
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Alternative text' )
				).toHaveAttribute( 'readonly' );
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'text_custom_field' );

				// Title input is enabled and with the original value.
				await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'button', { name: 'Advanced' } )
					.click();
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Title attribute' )
				).toBeEnabled();
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'default title value' );
			} );
		} );
	} );

	test.describe( 'Post/page context', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( { title: 'Test bindings' } );
		} );
		test.describe( 'Paragraph', () => {
			test( 'Should show the value of the custom field when exists', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						anchor: 'paragraph-binding',
						content: 'paragraph default content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await expect( paragraphBlock ).toHaveText(
					'Value of the text_custom_field'
				);
				// Paragraph is not editable.
				await expect( paragraphBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);

				// Check the frontend shows the value of the custom field.
				const postId = await editor.publishPost();
				await page.goto( `/?p=${ postId }` );
				await expect(
					page.locator( '#paragraph-binding' )
				).toBeVisible();
				await expect( page.locator( '#paragraph-binding' ) ).toHaveText(
					'Value of the text_custom_field'
				);
			} );

			test( "Should show the value of the key when custom field doesn't exists", async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						anchor: 'paragraph-binding',
						content: 'p',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: 'non_existing_custom_field' },
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await expect( paragraphBlock ).toHaveText(
					'non_existing_custom_field'
				);
				// Paragraph is not editable.
				await expect( paragraphBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);

				// Check the frontend doesn't show the content.
				const postId = await editor.publishPost();
				await page.goto( `/?p=${ postId }` );
				await expect(
					page.locator( '#paragraph-binding' )
				).toBeHidden();
			} );
		} );

		test( 'Heading - should show the value of the custom field', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					anchor: 'heading-binding',
					content: 'heading default content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-meta',
								args: { key: 'text_custom_field' },
							},
						},
					},
				},
			} );
			const headingBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Heading',
			} );
			await expect( headingBlock ).toHaveText(
				'Value of the text_custom_field'
			);
			// Heading is not editable.
			await expect( headingBlock ).toHaveAttribute(
				'contenteditable',
				'false'
			);

			// Check the frontend shows the value of the custom field.
			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );
			await expect( page.locator( '#heading-binding' ) ).toBeVisible();
			await expect( page.locator( '#heading-binding' ) ).toHaveText(
				'Value of the text_custom_field'
			);
		} );

		test.describe( 'Button', () => {
			test( 'Should show the value of the custom field when text is bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: {
								anchor: 'button-text-binding',
								text: 'button default text',
								url: '#default-url',
								metadata: {
									bindings: {
										text: {
											source: 'core/post-meta',
											args: { key: 'text_custom_field' },
										},
									},
								},
							},
						},
					],
				} );
				const buttonBlock = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Button',
						exact: true,
					} )
					.getByRole( 'textbox' );
				await buttonBlock.click();
				await expect( buttonBlock ).toHaveText(
					'Value of the text_custom_field'
				);

				// Button is not editable.
				await expect( buttonBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);

				// Check the frontend shows the value of the custom field.
				const postId = await editor.publishPost();
				await page.goto( `/?p=${ postId }` );
				const buttonDom = page.locator( '#button-text-binding a' );
				await expect( buttonDom ).toBeVisible();
				await expect( buttonDom ).toHaveText(
					'Value of the text_custom_field'
				);
				await expect( buttonDom ).toHaveAttribute(
					'href',
					'#default-url'
				);
			} );

			test( 'Should use the value of the custom field when url is bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: {
								anchor: 'button-url-binding',
								text: 'button default text',
								url: '#default-url',
								metadata: {
									bindings: {
										url: {
											source: 'core/post-meta',
											args: { key: 'url_custom_field' },
										},
									},
								},
							},
						},
					],
				} );

				// Check the frontend shows the original value of the custom field.
				const postId = await editor.publishPost();
				await page.goto( `/?p=${ postId }` );
				const buttonDom = page.locator( '#button-url-binding a' );
				await expect( buttonDom ).toBeVisible();
				await expect( buttonDom ).toHaveText( 'button default text' );
				await expect( buttonDom ).toHaveAttribute(
					'href',
					'#url-custom-field'
				);
			} );

			test( 'Should use the values of the custom fields when text and url are bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
							attributes: {
								anchor: 'button-multiple-bindings',
								text: 'button default text',
								url: '#default-url',
								metadata: {
									bindings: {
										text: {
											source: 'core/post-meta',
											args: { key: 'text_custom_field' },
										},
										url: {
											source: 'core/post-meta',
											args: { key: 'url_custom_field' },
										},
									},
								},
							},
						},
					],
				} );

				// Check the frontend uses the values of the custom fields.
				const postId = await editor.publishPost();
				await page.goto( `/?p=${ postId }` );
				const buttonDom = page.locator( '#button-multiple-bindings a' );
				await expect( buttonDom ).toBeVisible();
				await expect( buttonDom ).toHaveText(
					'Value of the text_custom_field'
				);
				await expect( buttonDom ).toHaveAttribute(
					'href',
					'#url-custom-field'
				);
			} );
		} );

		test.describe( 'Image', () => {
			test.beforeAll( async ( { requestUtils } ) => {
				const customFieldMedia = await requestUtils.uploadMedia(
					path.join(
						'./test/e2e/assets',
						'1024x768_e2e_test_image_size.jpeg'
					)
				);
				imageCustomFieldSrc = customFieldMedia.source_url;
			} );

			test.beforeEach( async ( { editor, page, requestUtils } ) => {
				const postId = await editor.publishPost();
				await requestUtils.rest( {
					method: 'POST',
					path: '/wp/v2/posts/' + postId,
					data: {
						meta: {
							url_custom_field: imageCustomFieldSrc,
						},
					},
				} );
				await page.reload();
			} );
			test( 'Should show the value of the custom field when url is bound', async ( {
				editor,
				page,
				BlockBindingsUtils,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						anchor: 'image-url-binding',
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								url: {
									source: 'core/post-meta',
									args: { key: 'url_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlockImg = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Image',
					} )
					.locator( 'img' );
				await expect( imageBlockImg ).toHaveAttribute(
					'src',
					imageCustomFieldSrc
				);

				// Check the frontend uses the value of the custom field.
				const postId = await BlockBindingsUtils.updatePost();
				await page.goto( `/?p=${ postId }` );
				const imageDom = page.locator( '#image-url-binding img' );
				await expect( imageDom ).toBeVisible();
				await expect( imageDom ).toHaveAttribute(
					'src',
					imageCustomFieldSrc
				);
				await expect( imageDom ).toHaveAttribute(
					'alt',
					'default alt value'
				);
				await expect( imageDom ).toHaveAttribute(
					'title',
					'default title value'
				);
			} );

			test( 'Should show value of the custom field in the alt textarea when alt is bound', async ( {
				editor,
				page,
				BlockBindingsUtils,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						anchor: 'image-alt-binding',
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								alt: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlockImg = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Image',
					} )
					.locator( 'img' );
				await imageBlockImg.click();

				// Image src is the placeholder.
				await expect( imageBlockImg ).toHaveAttribute(
					'src',
					imagePlaceholderSrc
				);

				// Alt textarea is disabled and with the custom field value.
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Alternative text' )
				).toHaveAttribute( 'readonly' );
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'Value of the text_custom_field' );

				// Check the frontend uses the value of the custom field.
				const postId = await BlockBindingsUtils.updatePost();
				await page.goto( `/?p=${ postId }` );
				const imageDom = page.locator( '#image-alt-binding img' );
				await expect( imageDom ).toBeVisible();
				await expect( imageDom ).toHaveAttribute(
					'src',
					imagePlaceholderSrc
				);
				await expect( imageDom ).toHaveAttribute(
					'alt',
					'Value of the text_custom_field'
				);
				await expect( imageDom ).toHaveAttribute(
					'title',
					'default title value'
				);
			} );

			test( 'Should show value of the custom field in the title input when title is bound', async ( {
				editor,
				page,
				BlockBindingsUtils,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						anchor: 'image-title-binding',
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								title: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlockImg = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Image',
					} )
					.locator( 'img' );
				await imageBlockImg.click();

				// Image src is the placeholder.
				await expect( imageBlockImg ).toHaveAttribute(
					'src',
					imagePlaceholderSrc
				);

				// Title input is disabled and with the custom field value.
				const advancedButton = page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'button', {
						name: 'Advanced',
					} );
				const isAdvancedPanelOpen =
					await advancedButton.getAttribute( 'aria-expanded' );
				if ( isAdvancedPanelOpen === 'false' ) {
					await advancedButton.click();
				}
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Title attribute' )
				).toHaveAttribute( 'readonly' );
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'Value of the text_custom_field' );

				// Check the frontend uses the value of the custom field.
				const postId = await BlockBindingsUtils.updatePost();
				await page.goto( `/?p=${ postId }` );
				const imageDom = page.locator( '#image-title-binding img' );
				await expect( imageDom ).toBeVisible();
				await expect( imageDom ).toHaveAttribute(
					'src',
					imagePlaceholderSrc
				);
				await expect( imageDom ).toHaveAttribute(
					'alt',
					'default alt value'
				);
				await expect( imageDom ).toHaveAttribute(
					'title',
					'Value of the text_custom_field'
				);
			} );

			test( 'Multiple bindings should show the value of the custom fields', async ( {
				editor,
				page,
				BlockBindingsUtils,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						anchor: 'image-multiple-bindings',
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								url: {
									source: 'core/post-meta',
									args: { key: 'url_custom_field' },
								},
								alt: {
									source: 'core/post-meta',
									args: { key: 'text_custom_field' },
								},
							},
						},
					},
				} );
				const imageBlockImg = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Image',
					} )
					.locator( 'img' );
				await imageBlockImg.click();

				// Image src is the custom field value.
				await expect( imageBlockImg ).toHaveAttribute(
					'src',
					imageCustomFieldSrc
				);

				// Alt textarea is disabled and with the custom field value.
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Alternative text' )
				).toHaveAttribute( 'readonly' );
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'Value of the text_custom_field' );

				// Title input is enabled and with the original value.
				const advancedButton = page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByRole( 'button', {
						name: 'Advanced',
					} );
				const isAdvancedPanelOpen =
					await advancedButton.getAttribute( 'aria-expanded' );
				if ( isAdvancedPanelOpen === 'false' ) {
					await advancedButton.click();
				}
				await expect(
					page
						.getByRole( 'tabpanel', { name: 'Settings' } )
						.getByLabel( 'Title attribute' )
				).toBeEnabled();
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'default title value' );

				// Check the frontend uses the values of the custom fields.
				const postId = await BlockBindingsUtils.updatePost();
				await page.goto( `/?p=${ postId }` );
				const imageDom = page.locator( '#image-multiple-bindings img' );
				await expect( imageDom ).toBeVisible();
				await expect( imageDom ).toHaveAttribute(
					'src',
					imageCustomFieldSrc
				);
				await expect( imageDom ).toHaveAttribute(
					'alt',
					'Value of the text_custom_field'
				);
				await expect( imageDom ).toHaveAttribute(
					'title',
					'default title value'
				);
			} );
		} );
	} );
} );

class BlockBindingsUtils {
	constructor( { page } ) {
		this.page = page;
	}

	// Helper to update the post.
	async updatePost() {
		await this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Update' } )
			.click();
		await this.page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'updated' } )
			.waitFor();
		const postId = new URL( this.page.url() ).searchParams.get( 'post' );

		return typeof postId === 'string' ? parseInt( postId, 10 ) : null;
	}
}
