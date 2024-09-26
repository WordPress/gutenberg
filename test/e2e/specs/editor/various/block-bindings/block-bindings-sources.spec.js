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
								source: 'testing/custom-source',
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
								source: 'testing/custom-source',
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
										source: 'testing/custom-source',
										args: { key: 'text_field' },
									},
									url: {
										source: 'testing/custom-source',
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
								source: 'testing/custom-source',
								args: { key: 'url_field' },
							},
							alt: {
								source: 'testing/custom-source',
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
				).toBeEnabled();
				const titleValue = await page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Title attribute' )
					.inputValue();
				expect( titleValue ).toBe( 'default title value' );
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
				source: 'testing/set-values-undefined',
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

	test.describe( 'setValues', () => {
		test( 'should be possible to edit the value from paragraph content', async () => {} );
		// Related issue: https://github.com/WordPress/gutenberg/issues/62347
		test( 'should be possible to use symbols and numbers as the custom field value', async () => {} );
		test( 'should be possible to edit the value from heading content', async () => {} );
		test( 'should be possible to edit the values from button attributes', async () => {} );
		test( 'should be possible to edit the values from image attributes', async () => {} );
	} );

	test.describe( 'getFieldsList', () => {
		test( 'should show all the available fields in the dropdown UI', async () => {} );
		test( 'should show the connected values in the attributes panel', async () => {} );
		test( 'should be possible to connect the paragraph content', async () => {} );
		test( 'should be possible to connect the heading content', async () => {} );
		test( 'should be possible to connect the button supported attributes', async () => {
			// Check the not supported ones are not included.
		} );
		test( 'should be possible to connect the image supported attributes', async () => {
			// Check the not supported ones are not included.
		} );
	} );

	test.describe( 'RichText workflows', () => {
		test( 'should add empty paragraph block when pressing enter in paragraph', async () => {} );
		test( 'should add empty paragraph block when pressing enter in heading', async () => {} );
		test( 'should add empty button block when pressing enter in button', async () => {} );
		test( 'should show placeholder prompt when value is empty and can edit', async () => {} );
		test( 'should show `getFieldsList` label or the source label when value is empty and cannot edit', async () => {} );
		test( 'should show placeholder attribute over bindings placeholder', async () => {} );
	} );

	test( 'should show the label of a source only registered in the server in blocks connected', async () => {} );
	test( 'should lock editing when connected to an undefined source', async () => {} );
	test( 'should show an "Invalid source" warning for not registered sources', async () => {} );
} );
