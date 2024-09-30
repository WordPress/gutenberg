/**
 * External dependencies
 */
const path = require( 'path' );
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Registered sources', () => {
	let imagePlaceholderSrc;
	let testingImgSrc;
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme(
			'gutenberg-test-themes/block-bindings'
		);
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
		await requestUtils.deleteAllMedia();
		const placeholderMedia = await requestUtils.uploadMedia(
			path.join( './test/e2e/assets', '10x10_e2e_test_image_z9T8jK.png' )
		);
		imagePlaceholderSrc = placeholderMedia.source_url;

		const testingImgMedia = await requestUtils.uploadMedia(
			path.join(
				'./test/e2e/assets',
				'1024x768_e2e_test_image_size.jpeg'
			)
		);
		testingImgSrc = testingImgMedia.source_url;
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( { title: 'Test bindings' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.describe( 'getValues', () => {
		test( 'should show the returned value in paragraph content', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					anchor: 'connected-paragraph',
					content: 'paragraph default content',
					metadata: {
						bindings: {
							content: {
								source: 'testing/complete-source',
								args: { key: 'text_field' },
							},
						},
					},
				},
			} );
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText( 'Text Field Value' );

			// Check the frontend shows the value of the custom field.
			const previewPage = await editor.openPreviewPage();
			await expect(
				previewPage.locator( '#connected-paragraph' )
			).toHaveText( 'Text Field Value' );
		} );
		test( 'should show the returned value in heading content', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					anchor: 'connected-heading',
					content: 'heading default content',
					metadata: {
						bindings: {
							content: {
								source: 'testing/complete-source',
								args: { key: 'text_field' },
							},
						},
					},
				},
			} );
			const headingBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Heading',
			} );
			await expect( headingBlock ).toHaveText( 'Text Field Value' );

			// Check the frontend shows the value of the custom field.
			const previewPage = await editor.openPreviewPage();
			await expect(
				previewPage.locator( '#connected-heading' )
			).toHaveText( 'Text Field Value' );
		} );
		test( 'should show the returned values in button attributes', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/buttons',
				innerBlocks: [
					{
						name: 'core/button',
						attributes: {
							anchor: 'connected-button',
							text: 'button default text',
							url: '#default-url',
							metadata: {
								bindings: {
									text: {
										source: 'testing/complete-source',
										args: { key: 'text_field' },
									},
									url: {
										source: 'testing/complete-source',
										args: { key: 'url_field' },
									},
								},
							},
						},
					},
				],
			} );

			// Check the frontend uses the values of the custom fields.
			const previewPage = await editor.openPreviewPage();
			const buttonDom = previewPage.locator( '#connected-button a' );
			await expect( buttonDom ).toHaveText( 'Text Field Value' );
			await expect( buttonDom ).toHaveAttribute( 'href', testingImgSrc );
		} );
		test( 'should show the returned values in image attributes', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/image',
				attributes: {
					anchor: 'connected-image',
					url: imagePlaceholderSrc,
					alt: 'default alt value',
					title: 'default title value',
					metadata: {
						bindings: {
							url: {
								source: 'testing/complete-source',
								args: { key: 'url_field' },
							},
							alt: {
								source: 'testing/complete-source',
								args: { key: 'text_field' },
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
				testingImgSrc
			);

			// Alt textarea should have the custom field value.
			const altValue = await page
				.getByRole( 'tabpanel', { name: 'Settings' } )
				.getByLabel( 'Alternative text' )
				.inputValue();
			expect( altValue ).toBe( 'Text Field Value' );

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
			const imageDom = previewPage.locator( '#connected-image img' );
			await expect( imageDom ).toHaveAttribute( 'src', testingImgSrc );
			await expect( imageDom ).toHaveAttribute(
				'alt',
				'Text Field Value'
			);
			await expect( imageDom ).toHaveAttribute(
				'title',
				'default title value'
			);
		} );
		test( 'should fall back to source label when `getValues` is undefined', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'paragraph default content',
					metadata: {
						bindings: {
							content: {
								source: 'testing/server-only-source',
								args: { key: 'text_field' },
							},
						},
					},
				},
			} );
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText( 'Server Source' );
		} );
		test( 'should fall back to null when `getValues` is undefined in URL attributes', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/image',
				attributes: {
					metadata: {
						bindings: {
							url: {
								source: 'testing/server-only-source',
								args: { key: 'url_field' },
							},
						},
					},
				},
			} );
			const imageBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Image',
			} );
			await expect(
				imageBlock.locator( '.components-placeholder__fieldset' )
			).toHaveText( 'Connected to Server Source' );
		} );
	} );

	test.describe( 'should lock editing', () => {
		// Logic reused accross all the tests that check paragraph editing is locked.
		async function testParagraphControlsAreLocked( {
			source,
			editor,
			page,
		} ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'paragraph default content',
					metadata: {
						bindings: {
							content: {
								source,
								args: { key: 'text_field' },
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
		}
		test.describe( 'canUserEditValue returns false', () => {
			test( 'paragraph', async ( { editor, page } ) => {
				await testParagraphControlsAreLocked( {
					source: 'testing/can-user-edit-false',
					editor,
					page,
				} );
			} );
			test( 'heading', async ( { editor, page } ) => {
				await editor.insertBlock( {
					name: 'core/heading',
					attributes: {
						content: 'heading default content',
						metadata: {
							bindings: {
								content: {
									source: 'testing/can-user-edit-false',
									args: { key: 'text_field' },
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
			test( 'button', async ( { editor, page } ) => {
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
											source: 'testing/can-user-edit-false',
											args: { key: 'text_field' },
										},
										url: {
											source: 'testing/can-user-edit-false',
											args: { key: 'url_field' },
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
			test( 'image', async ( { editor, page } ) => {
				await editor.insertBlock( {
					name: 'core/image',
					attributes: {
						url: imagePlaceholderSrc,
						alt: 'default alt value',
						title: 'default title value',
						metadata: {
							bindings: {
								url: {
									source: 'testing/can-user-edit-false',
									args: { key: 'url_field' },
								},
								alt: {
									source: 'testing/can-user-edit-false',
									args: { key: 'text_field' },
								},
								title: {
									source: 'testing/can-user-edit-false',
									args: { key: 'text_field' },
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
				expect( altValue ).toBe( 'Text Field Value' );

				// Title input is enabled and with the original value.
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
				expect( titleValue ).toBe( 'Text Field Value' );
			} );
		} );
		// The following tests just check the paragraph and assume is the case for the rest of the blocks.
		test( 'canUserEditValue is not defined', async ( { editor, page } ) => {
			await testParagraphControlsAreLocked( {
				source: 'testing/can-user-edit-undefined',
				editor,
				page,
			} );
		} );
		test( 'setValues is not defined', async ( { editor, page } ) => {
			await testParagraphControlsAreLocked( {
				source: 'testing/complete-source-undefined',
				editor,
				page,
			} );
		} );
		test( 'source is not defined', async ( { editor, page } ) => {
			await testParagraphControlsAreLocked( {
				source: 'testing/undefined-source',
				editor,
				page,
			} );
		} );
	} );

	// Use `core/post-meta` source to test editing to avoid overcomplicating custom sources.
	// It needs a source that can be consumed and edited from the server and the editor.
	test.describe( 'setValues', () => {
		test( 'should be possible to edit the value from paragraph content', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					anchor: 'connected-paragraph',
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
				previewPage.locator( '#connected-paragraph' )
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
			testingImgSrc = customFieldMedia.source_url;

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
				.fill( testingImgSrc );
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
			).toHaveAttribute( 'src', testingImgSrc );
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

	test.describe( 'getFieldsList', () => {
		test( 'should be possible to update attribute value through bindings UI', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );
			await page.getByLabel( 'Attributes options' ).click();
			await page
				.getByRole( 'menuitemcheckbox', {
					name: 'Show content',
				} )
				.click();
			await page.getByRole( 'button', { name: 'content' } ).click();
			await page
				.getByRole( 'menuitemradio' )
				.filter( { hasText: 'Text Field Label' } )
				.click();
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText( 'Text Field Value' );
		} );
		test( 'should be possible to connect the paragraph content', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );
			await page.getByLabel( 'Attributes options' ).click();
			const contentAttribute = page.getByRole( 'menuitemcheckbox', {
				name: 'Show content',
			} );
			await expect( contentAttribute ).toBeVisible();
		} );
		test( 'should be possible to connect the heading content', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
			} );
			await page.getByLabel( 'Attributes options' ).click();
			const contentAttribute = page.getByRole( 'menuitemcheckbox', {
				name: 'Show content',
			} );
			await expect( contentAttribute ).toBeVisible();
		} );
		test( 'should be possible to connect the button supported attributes', async ( {
			editor,
			page,
		} ) => {
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
			const linkTargetAttribute = page.getByRole( 'menuitemcheckbox', {
				name: 'Show linkTarget',
			} );
			await expect( linkTargetAttribute ).toBeVisible();
			const relAttribute = page.getByRole( 'menuitemcheckbox', {
				name: 'Show rel',
			} );
			await expect( relAttribute ).toBeVisible();
			// Check not supported attributes are not included.
			const tagNameAttribute = page.getByRole( 'menuitemcheckbox', {
				name: 'Show tagName',
			} );
			await expect( tagNameAttribute ).toBeHidden();
		} );
		test( 'should be possible to connect the image supported attributes', async ( {
			editor,
			page,
		} ) => {
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
			// Check not supported attributes are not included.
			const linkClassAttribute = page.getByRole( 'menuitemcheckbox', {
				name: 'Show linkClass',
			} );
			await expect( linkClassAttribute ).toBeHidden();
		} );
		test( 'should show all the available fields in the dropdown UI', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'default value',
					metadata: {
						bindings: {
							content: {
								source: 'testing/complete-source',
								args: { key: 'text_field' },
							},
						},
					},
				},
			} );
			await page.getByRole( 'button', { name: 'content' } ).click();
			const textField = page
				.getByRole( 'menuitemradio' )
				.filter( { hasText: 'Text Field Label' } );
			await expect( textField ).toBeVisible();
			await expect( textField ).toBeChecked();
			const urlField = page
				.getByRole( 'menuitemradio' )
				.filter( { hasText: 'URL Field Label' } );
			await expect( urlField ).toBeVisible();
			await expect( urlField ).not.toBeChecked();
		} );
		test( 'should show the connected fields in the attributes panel', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'default value',
					metadata: {
						bindings: {
							content: {
								source: 'testing/complete-source',
								args: { key: 'text_field' },
							},
						},
					},
				},
			} );
			const contentButton = page.getByRole( 'button', {
				name: 'content',
			} );
			await expect( contentButton ).toContainText( 'Text Field Label' );
		} );
	} );

	test.describe( 'RichText workflows', () => {
		test( 'should add empty paragraph block when pressing enter in paragraph', async ( {
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
								source: 'testing/complete-source',
								args: { key: 'text_field' },
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
			const [ initialParagraph, newEmptyParagraph ] = await editor.canvas
				.locator( '[data-type="core/paragraph"]' )
				.all();
			await expect( initialParagraph ).toHaveText( 'Text Field Value' );
			await expect( newEmptyParagraph ).toHaveText( '' );
			await expect( newEmptyParagraph ).toBeEditable();
		} );
		test( 'should add empty paragraph block when pressing enter in heading', async ( {
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
								source: 'testing/complete-source',
								args: { key: 'text_field' },
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
			const [ initialHeading, newEmptyParagraph ] = await editor.canvas
				.locator( '[data-block]' )
				.all();
			// First block should be the original block.
			await expect( initialHeading ).toHaveAttribute(
				'data-type',
				'core/heading'
			);
			await expect( initialHeading ).toHaveText( 'Text Field Value' );
			// Second block should be an empty paragraph block.
			await expect( newEmptyParagraph ).toHaveAttribute(
				'data-type',
				'core/paragraph'
			);
			await expect( newEmptyParagraph ).toHaveText( '' );
			await expect( newEmptyParagraph ).toBeEditable();
		} );
		test( 'should add empty button block when pressing enter in button', async ( {
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
										source: 'testing/complete-source',
										args: { key: 'text_field' },
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
			await expect( initialButton ).toHaveText( 'Text Field Value' );
			// Second block should be an empty paragraph block.
			await expect( newEmptyButton ).toHaveText( '' );
			await expect( newEmptyButton ).toBeEditable();
		} );
		test( 'should show placeholder prompt when value is empty and can edit', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'paragraph default content',
					metadata: {
						bindings: {
							content: {
								source: 'testing/complete-source',
								args: { key: 'empty_field' },
							},
						},
					},
				},
			} );

			const paragraphBlock = editor.canvas.getByRole( 'document', {
				// Aria-label is changed for empty paragraphs.
				name: 'Empty empty_field; start writing to edit its value',
			} );

			await expect( paragraphBlock ).toBeEmpty();

			const placeholder = paragraphBlock.locator( 'span' );
			await expect( placeholder ).toHaveAttribute(
				'data-rich-text-placeholder',
				'Add Empty Field Label'
			);
		} );
		test( 'should show source label when value is empty, cannot edit, and `getFieldsList` is undefined', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'paragraph default content',
					metadata: {
						bindings: {
							content: {
								source: 'testing/can-user-edit-false',
								args: { key: 'empty_field' },
							},
						},
					},
				},
			} );
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				// Aria-label is changed for empty paragraphs.
				name: 'empty_field',
			} );
			await expect( paragraphBlock ).toBeEmpty();
			const placeholder = paragraphBlock.locator( 'span' );
			await expect( placeholder ).toHaveAttribute(
				'data-rich-text-placeholder',
				'Can User Edit: False'
			);
		} );
		test( 'should show placeholder attribute over bindings placeholder', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					placeholder: 'My custom placeholder',
					content: 'paragraph default content',
					metadata: {
						bindings: {
							content: {
								source: 'testing/complete-source',
								args: { key: 'empty_field' },
							},
						},
					},
				},
			} );
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				// Aria-label is changed for empty paragraphs.
				name: 'empty_field',
			} );

			await expect( paragraphBlock ).toBeEmpty();

			const placeholder = paragraphBlock.locator( 'span' );
			await expect( placeholder ).toHaveAttribute(
				'data-rich-text-placeholder',
				'My custom placeholder'
			);
		} );
	} );

	test( 'should show the label of a source only registered in the server in blocks connected', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				metadata: {
					bindings: {
						content: {
							source: 'testing/server-only-source',
						},
					},
				},
			},
		} );

		const contentButton = page.getByRole( 'button', {
			name: 'content',
		} );
		await expect( contentButton ).toContainText( 'Server Source' );
	} );
	test( 'should show an "Invalid source" warning for not registered sources', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				metadata: {
					bindings: {
						content: {
							source: 'testing/undefined-source',
						},
					},
				},
			},
		} );

		const contentButton = page.getByRole( 'button', {
			name: 'content',
		} );
		await expect( contentButton ).toContainText( 'Invalid source' );
	} );
} );
