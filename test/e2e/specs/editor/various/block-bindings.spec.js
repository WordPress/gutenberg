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

	test.describe( 'Template context', () => {
		test.beforeEach( async ( { admin, editor } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//index',
				postType: 'wp_template',
				canvas: 'edit',
			} );
			await editor.openDocumentSettingsSidebar();
		} );

		test.describe( 'Paragraph', () => {
			test( 'should show the value of the custom field', async ( {
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

			test( 'should lock the appropriate controls with a registered source', async ( {
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

			test( 'should lock the appropriate controls when source is not defined', async ( {
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
			test( 'should show the key of the custom field', async ( {
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

			test( 'should lock the appropriate controls with a registered source', async ( {
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

			test( 'should lock the appropriate controls when source is not defined', async ( {
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
			test( 'should show the key of the custom field when text is bound', async ( {
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

			test( 'should lock text controls when text is bound to a registered source', async ( {
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

			test( 'should lock text controls when text is bound to an undefined source', async ( {
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

			test( 'should lock url controls when url is bound to a registered source', async ( {
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

			test( 'should lock url controls when url is bound to an undefined source', async ( {
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

			test( 'should lock url and text controls when both are bound', async ( {
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
			test( 'should show the upload form when url is not bound', async ( {
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

			test( 'should NOT show the upload form when url is bound to a registered source', async ( {
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

			test( 'should NOT show the upload form when url is bound to an undefined source', async ( {
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

			test( 'should lock url controls when url is bound to a registered source', async ( {
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

			test( 'should lock url controls when url is bound to an undefined source', async ( {
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

			test( 'should disable alt textarea when alt is bound to a registered source', async ( {
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

			test( 'should disable alt textarea when alt is bound to an undefined source', async ( {
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

			test( 'should disable title input when title is bound to a registered source', async ( {
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

			test( 'should disable title input when title is bound to an undefined source', async ( {
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
			test( 'should show the value of the custom field when exists', async ( {
				editor,
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

				// Check the frontend shows the value of the custom field.
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#paragraph-binding' )
				).toHaveText( 'Value of the text_custom_field' );
			} );

			test( "should show the value of the key when custom field doesn't exist", async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						anchor: 'paragraph-binding',
						content: 'fallback value',
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
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#paragraph-binding' )
				).toHaveText( 'fallback value' );
			} );

			test( 'should not show the value of a protected meta field', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						anchor: 'paragraph-binding',
						content: 'fallback value',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: '_protected_field' },
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await expect( paragraphBlock ).toHaveText( '_protected_field' );
				// Check the frontend doesn't show the content.
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#paragraph-binding' )
				).toHaveText( 'fallback value' );
			} );

			test( 'should not show the value of a meta field with `show_in_rest` false', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						anchor: 'paragraph-binding',
						content: 'fallback value',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: 'show_in_rest_false_field' },
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await expect( paragraphBlock ).toHaveText(
					'show_in_rest_false_field'
				);
				// Check the frontend doesn't show the content.
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#paragraph-binding' )
				).toHaveText( 'fallback value' );
			} );

			test( 'should add empty paragraph block when pressing enter', async ( {
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
				// Select the paragraph and press Enter at the end of it.
				const paragraph = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await editor.selectBlocks( paragraph );
				await page.keyboard.press( 'End' );
				await page.keyboard.press( 'Enter' );
				const [ initialParagraph, newEmptyParagraph ] =
					await editor.canvas
						.locator( '[data-type="core/paragraph"]' )
						.all();
				await expect( initialParagraph ).toHaveText(
					'Value of the text_custom_field'
				);
				await expect( newEmptyParagraph ).toHaveText( '' );
				await expect( newEmptyParagraph ).toBeEditable();
			} );

			test( 'should NOT be possible to edit the value of the custom field when it is protected', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						anchor: 'protected-field-binding',
						content: 'fallback value',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: '_protected_field' },
								},
							},
						},
					},
				} );

				const protectedFieldBlock = editor.canvas.getByRole(
					'document',
					{
						name: 'Block: Paragraph',
					}
				);

				await expect( protectedFieldBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);
			} );

			test( 'should NOT be possible to edit the value of the custom field when it is not shown in the REST API', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						anchor: 'show-in-rest-false-binding',
						content: 'fallback value',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: 'show_in_rest_false_field' },
								},
							},
						},
					},
				} );

				const showInRestFalseBlock = editor.canvas.getByRole(
					'document',
					{
						name: 'Block: Paragraph',
					}
				);

				await expect( showInRestFalseBlock ).toHaveAttribute(
					'contenteditable',
					'false'
				);
			} );
			test( 'should show a selector for content', async ( {
				editor,
				page,
			} ) => {
				// Activate the block bindings UI experiment.
				await page.evaluate( () => {
					window.__experimentalBlockBindingsUI = true;
				} );

				await editor.insertBlock( {
					name: 'core/paragraph',
				} );
				await page
					.getByRole( 'tabpanel', {
						name: 'Settings',
					} )
					.getByLabel( 'Attributes options' )
					.click();
				const contentAttribute = page.getByRole( 'menuitemcheckbox', {
					name: 'Show content',
				} );
				await expect( contentAttribute ).toBeVisible();
			} );
			test( 'should use a selector to update the content', async ( {
				editor,
				page,
			} ) => {
				// Activate the block bindings UI experiment.
				await page.evaluate( () => {
					window.__experimentalBlockBindingsUI = true;
				} );

				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'fallback value',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: { key: 'undefined_field' },
								},
							},
						},
					},
				} );
				await page
					.getByRole( 'tabpanel', {
						name: 'Settings',
					} )
					.getByRole( 'button', { name: 'content' } )
					.click();

				await page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: 'text_custom_field' } )
					.click();
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await expect( paragraphBlock ).toHaveText(
					'Value of the text_custom_field'
				);
			} );
		} );

		test.describe( 'Heading', () => {
			test( 'should show the value of the custom field', async ( {
				editor,
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

				// Check the frontend shows the value of the custom field.
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#heading-binding' )
				).toHaveText( 'Value of the text_custom_field' );
			} );

			test( 'should add empty paragraph block when pressing enter', async ( {
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

				// Select the heading and press Enter at the end of it.
				const heading = editor.canvas.getByRole( 'document', {
					name: 'Block: Heading',
				} );
				await editor.selectBlocks( heading );
				await page.keyboard.press( 'End' );
				await page.keyboard.press( 'Enter' );
				// Can't use `editor.getBlocks` because it doesn't return the meta value shown in the editor.
				const [ initialHeading, newEmptyParagraph ] =
					await editor.canvas.locator( '[data-block]' ).all();
				// First block should be the original block.
				await expect( initialHeading ).toHaveAttribute(
					'data-type',
					'core/heading'
				);
				await expect( initialHeading ).toHaveText(
					'Value of the text_custom_field'
				);
				// Second block should be an empty paragraph block.
				await expect( newEmptyParagraph ).toHaveAttribute(
					'data-type',
					'core/paragraph'
				);
				await expect( newEmptyParagraph ).toHaveText( '' );
				await expect( newEmptyParagraph ).toBeEditable();
			} );
			test( 'should show a selector for content', async ( {
				editor,
				page,
			} ) => {
				// Activate the block bindings UI experiment.
				await page.evaluate( () => {
					window.__experimentalBlockBindingsUI = true;
				} );

				await editor.insertBlock( {
					name: 'core/heading',
				} );
				await page
					.getByRole( 'tabpanel', {
						name: 'Settings',
					} )
					.getByLabel( 'Attributes options' )
					.click();
				const contentAttribute = page.getByRole( 'menuitemcheckbox', {
					name: 'Show content',
				} );
				await expect( contentAttribute ).toBeVisible();
			} );
		} );

		test.describe( 'Button', () => {
			test( 'should show the value of the custom field when text is bound', async ( {
				editor,
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

				// Check the frontend shows the value of the custom field.
				const previewPage = await editor.openPreviewPage();
				const buttonDom = previewPage.locator(
					'#button-text-binding a'
				);
				await expect( buttonDom ).toHaveText(
					'Value of the text_custom_field'
				);
				await expect( buttonDom ).toHaveAttribute(
					'href',
					'#default-url'
				);
			} );

			test( 'should use the value of the custom field when url is bound', async ( {
				editor,
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
				const previewPage = await editor.openPreviewPage();
				const buttonDom = previewPage.locator(
					'#button-url-binding a'
				);
				await expect( buttonDom ).toHaveText( 'button default text' );
				await expect( buttonDom ).toHaveAttribute(
					'href',
					'#url-custom-field'
				);
			} );

			test( 'should use the values of the custom fields when text and url are bound', async ( {
				editor,
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
				const previewPage = await editor.openPreviewPage();
				const buttonDom = previewPage.locator(
					'#button-multiple-bindings a'
				);
				await expect( buttonDom ).toHaveText(
					'Value of the text_custom_field'
				);
				await expect( buttonDom ).toHaveAttribute(
					'href',
					'#url-custom-field'
				);
			} );

			test( 'should add empty button block when pressing enter', async ( {
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
				await editor.canvas
					.getByRole( 'document', {
						name: 'Block: Button',
						exact: true,
					} )
					.getByRole( 'textbox' )
					.click();
				await page.keyboard.press( 'End' );
				await page.keyboard.press( 'Enter' );
				const [ initialButton, newEmptyButton ] = await editor.canvas
					.locator( '[data-type="core/button"]' )
					.all();
				// First block should be the original block.
				await expect( initialButton ).toHaveText(
					'Value of the text_custom_field'
				);
				// Second block should be an empty paragraph block.
				await expect( newEmptyButton ).toHaveText( '' );
				await expect( newEmptyButton ).toBeEditable();
			} );
			test( 'should show a selector for url, text, linkTarget and rel', async ( {
				editor,
				page,
			} ) => {
				// Activate the block bindings UI experiment.
				await page.evaluate( () => {
					window.__experimentalBlockBindingsUI = true;
				} );

				await editor.insertBlock( {
					name: 'core/buttons',
					innerBlocks: [
						{
							name: 'core/button',
						},
					],
				} );
				await editor.canvas
					.getByRole( 'document', {
						name: 'Block: Button',
						exact: true,
					} )
					.getByRole( 'textbox' )
					.click();
				await page
					.getByRole( 'tabpanel', {
						name: 'Settings',
					} )
					.getByLabel( 'Attributes options' )
					.click();
				const urlAttribute = page.getByRole( 'menuitemcheckbox', {
					name: 'Show url',
				} );
				await expect( urlAttribute ).toBeVisible();
				const textAttribute = page.getByRole( 'menuitemcheckbox', {
					name: 'Show text',
				} );
				await expect( textAttribute ).toBeVisible();
				const linkTargetAttribute = page.getByRole(
					'menuitemcheckbox',
					{
						name: 'Show linkTarget',
					}
				);
				await expect( linkTargetAttribute ).toBeVisible();
				const relAttribute = page.getByRole( 'menuitemcheckbox', {
					name: 'Show rel',
				} );
				await expect( relAttribute ).toBeVisible();
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
			test( 'should show the value of the custom field when url is bound', async ( {
				editor,
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
				const previewPage = await editor.openPreviewPage();
				const imageDom = previewPage.locator(
					'#image-url-binding img'
				);
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

			test( 'should show value of the custom field in the alt textarea when alt is bound', async ( {
				editor,
				page,
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

				// Alt textarea should have the custom field value.
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'Value of the text_custom_field' );

				// Check the frontend uses the value of the custom field.
				const previewPage = await editor.openPreviewPage();
				const imageDom = previewPage.locator(
					'#image-alt-binding img'
				);
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

			test( 'should show value of the custom field in the title input when title is bound', async ( {
				editor,
				page,
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

				// Title input should have the custom field value.
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
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'Value of the text_custom_field' );

				// Check the frontend uses the value of the custom field.
				const previewPage = await editor.openPreviewPage();
				const imageDom = previewPage.locator(
					'#image-title-binding img'
				);
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

				// Alt textarea should have the custom field value.
				const altValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' )
					.inputValue();
				expect( altValue ).toBe( 'Value of the text_custom_field' );

				// Title input should have the original value.
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
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'default title value' );

				// Check the frontend uses the values of the custom fields.
				const previewPage = await editor.openPreviewPage();
				const imageDom = previewPage.locator(
					'#image-multiple-bindings img'
				);
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
			test( 'should show a selector for url, id, title and alt', async ( {
				editor,
				page,
			} ) => {
				// Activate the block bindings UI experiment.
				await page.evaluate( () => {
					window.__experimentalBlockBindingsUI = true;
				} );

				await editor.insertBlock( {
					name: 'core/image',
				} );
				await page
					.getByRole( 'tabpanel', {
						name: 'Settings',
					} )
					.getByLabel( 'Attributes options' )
					.click();
				const urlAttribute = page.getByRole( 'menuitemcheckbox', {
					name: 'Show url',
				} );
				await expect( urlAttribute ).toBeVisible();
				const idAttribute = page.getByRole( 'menuitemcheckbox', {
					name: 'Show id',
				} );
				await expect( idAttribute ).toBeVisible();
				const titleAttribute = page.getByRole( 'menuitemcheckbox', {
					name: 'Show title',
				} );
				await expect( titleAttribute ).toBeVisible();
				const altAttribute = page.getByRole( 'menuitemcheckbox', {
					name: 'Show alt',
				} );
				await expect( altAttribute ).toBeVisible();
			} );
		} );

		test.describe( 'Edit custom fields', () => {
			test( 'should be possible to edit the value of the custom field from the paragraph', async ( {
				editor,
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

				await expect( paragraphBlock ).toHaveAttribute(
					'contenteditable',
					'true'
				);
				await paragraphBlock.fill( 'new value' );
				// Check that the paragraph content attribute didn't change.
				const [ paragraphBlockObject ] = await editor.getBlocks();
				expect( paragraphBlockObject.attributes.content ).toBe(
					'paragraph default content'
				);
				// Check the value of the custom field is being updated by visiting the frontend.
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#paragraph-binding' )
				).toHaveText( 'new value' );
			} );

			// Related issue: https://github.com/WordPress/gutenberg/issues/62347
			test( 'should be possible to use symbols and numbers as the custom field value', async ( {
				editor,
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

				await expect( paragraphBlock ).toHaveAttribute(
					'contenteditable',
					'true'
				);
				await paragraphBlock.fill( '$10.00' );
				// Check the value of the custom field is being updated by visiting the frontend.
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#paragraph-binding' )
				).toHaveText( '$10.00' );
			} );

			test( 'should be possible to edit the value of the url custom field from the button', async ( {
				editor,
				page,
				pageUtils,
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

				// Edit the url.
				const buttonBlock = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Button',
						exact: true,
					} )
					.getByRole( 'textbox' );
				await buttonBlock.click();
				await page
					.getByRole( 'button', { name: 'Edit link', exact: true } )
					.click();
				await page
					.getByPlaceholder( 'Search or type URL' )
					.fill( '#url-custom-field-modified' );
				await pageUtils.pressKeys( 'Enter' );

				// Check that the button url attribute didn't change.
				const [ buttonsObject ] = await editor.getBlocks();
				expect( buttonsObject.innerBlocks[ 0 ].attributes.url ).toBe(
					'#default-url'
				);
				// Check the value of the custom field is being updated by visiting the frontend.
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#button-url-binding a' )
				).toHaveAttribute( 'href', '#url-custom-field-modified' );
			} );

			test( 'should be possible to edit the value of the url custom field from the image', async ( {
				editor,
				page,
				pageUtils,
				requestUtils,
			} ) => {
				const customFieldMedia = await requestUtils.uploadMedia(
					path.join(
						'./test/e2e/assets',
						'1024x768_e2e_test_image_size.jpeg'
					)
				);
				imageCustomFieldSrc = customFieldMedia.source_url;

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

				// Edit image url.
				await page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', {
						name: 'Replace',
					} )
					.click();
				await page
					.getByRole( 'button', { name: 'Edit link', exact: true } )
					.click();
				await page
					.getByPlaceholder( 'Search or type URL' )
					.fill( imageCustomFieldSrc );
				await pageUtils.pressKeys( 'Enter' );

				// Check that the image url attribute didn't change and still uses the placeholder.
				const [ imageBlockObject ] = await editor.getBlocks();
				expect( imageBlockObject.attributes.url ).toBe(
					imagePlaceholderSrc
				);

				// Check the value of the custom field is being updated by visiting the frontend.
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#image-url-binding img' )
				).toHaveAttribute( 'src', imageCustomFieldSrc );
			} );

			test( 'should be possible to edit the value of the text custom field from the image alt', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						anchor: 'image-alt-binding',
						url: imagePlaceholderSrc,
						alt: 'default alt value',
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

				// Edit the custom field value in the alt textarea.
				const altInputArea = page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Alternative text' );
				await expect( altInputArea ).not.toHaveAttribute( 'readonly' );
				await altInputArea.fill( 'new value' );

				// Check that the image alt attribute didn't change.
				const [ imageBlockObject ] = await editor.getBlocks();
				expect( imageBlockObject.attributes.alt ).toBe(
					'default alt value'
				);
				// Check the value of the custom field is being updated by visiting the frontend.
				const previewPage = await editor.openPreviewPage();
				await expect(
					previewPage.locator( '#image-alt-binding img' )
				).toHaveAttribute( 'alt', 'new value' );
			} );
		} );
	} );

	test.describe( 'Sources registration', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost( { title: 'Test bindings' } );
		} );

		test( 'should show the label of a source only registered in the server', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					metadata: {
						bindings: {
							content: {
								source: 'core/server-source',
							},
						},
					},
				},
			} );

			const bindingsPanel = page
				.getByRole( 'tabpanel', {
					name: 'Settings',
				} )
				.locator( '.block-editor-bindings__panel' );
			await expect( bindingsPanel ).toContainText( 'Server Source' );
		} );
	} );
} );
