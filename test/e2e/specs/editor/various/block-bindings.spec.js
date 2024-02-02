/**
 * External dependencies
 */
const path = require( 'path' );
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const textCustomFieldValue = 'Value of the text_custom_field';
const textCustomFieldKey = 'text_custom_field';
// Shared variables
const alignName = 'Align text';
const boldName = 'Bold';
// Paragraph block.
const contentBindingParagraphBlock = {
	name: 'core/paragraph',
	attributes: {
		content: 'p',
		metadata: {
			bindings: {
				content: {
					source: 'core/post-meta',
					args: { key: 'text_custom_field' },
				},
			},
		},
	},
};
// Heading block.
const contentBindingHeadingBlock = {
	name: 'core/heading',
	attributes: {
		content: 'h',
		metadata: {
			bindings: {
				content: {
					source: 'core/post-meta',
					args: { key: 'text_custom_field' },
				},
			},
		},
	},
};
// Button blocks.
const textBindingButtonBlock = {
	name: 'core/buttons',
	innerBlocks: [
		{
			name: 'core/button',
			attributes: {
				text: 'b',
				url: 'https://www.wordpress.org/',
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
};
const urlBindingButtonBlock = {
	name: 'core/buttons',
	innerBlocks: [
		{
			name: 'core/button',
			attributes: {
				text: 'b',
				url: 'https://www.wordpress.org/',
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
};
const multipleBindingsButtonBlock = {
	name: 'core/buttons',
	innerBlocks: [
		{
			name: 'core/button',
			attributes: {
				text: 'b',
				url: 'https://www.wordpress.org/',
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
};
// Image blocks.
let urlBindingImageBlock;
let altBindingImageBlock;
let titleBindingImageBlock;
let multipleBindingsImageBlock;
// Image variables.
const imageReplaceName = 'Replace';
const imageAltLabel = 'Alternative text';
const imageTitleLabel = 'Title attribute';

test.describe( 'Block bindings', () => {
	let placeholderSrc;
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
		await requestUtils.deleteAllMedia();
		const placeholderMedia = await requestUtils.uploadMedia(
			path.join( './test/e2e/assets', '10x10_e2e_test_image_z9T8jK.png' )
		);
		placeholderSrc = placeholderMedia.source_url;
		// Init image blocks.
		urlBindingImageBlock = {
			name: 'core/image',
			attributes: {
				url: placeholderSrc,
				alt: 'a',
				title: 't',
				metadata: {
					bindings: {
						url: {
							source: 'core/post-meta',
							args: { key: 'url_custom_field' },
						},
					},
				},
			},
		};
		altBindingImageBlock = {
			name: 'core/image',
			attributes: {
				url: placeholderSrc,
				alt: 'a',
				title: 't',
				metadata: {
					bindings: {
						alt: {
							source: 'core/post-meta',
							args: { key: 'text_custom_field' },
						},
					},
				},
			},
		};
		titleBindingImageBlock = {
			name: 'core/image',
			attributes: {
				url: placeholderSrc,
				alt: 'a',
				title: 't',
				metadata: {
					bindings: {
						title: {
							source: 'core/post-meta',
							args: { key: 'text_custom_field' },
						},
					},
				},
			},
		};
		multipleBindingsImageBlock = {
			name: 'core/image',
			attributes: {
				url: placeholderSrc,
				alt: 'a',
				title: 't',
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
		};
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
			} );
			await editor.canvas.locator( 'body' ).click();
			await editor.openDocumentSettingsSidebar();
		} );

		test.describe( 'Paragraph', () => {
			test( 'Should show the value of the custom field', async ( {
				editor,
			} ) => {
				await editor.insertBlock( contentBindingParagraphBlock );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				const paragraphContent = await paragraphBlock.textContent();
				expect( paragraphContent ).toBe( textCustomFieldKey );
			} );

			test( 'Should lock the appropriate controls', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( contentBindingParagraphBlock );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await paragraphBlock.click();

				// Alignment controls exist.
				await expect(
					page.getByRole( 'button', {
						name: alignName,
					} )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page.getByRole( 'button', {
						name: boldName,
					} )
				).toBeHidden();

				// Paragraph is not editable.
				const isContentEditable =
					await paragraphBlock.getAttribute( 'contenteditable' );
				expect( isContentEditable ).toBe( 'false' );
			} );
		} );

		test.describe( 'Heading', () => {
			test( 'Should show the key of the custom field', async ( {
				editor,
			} ) => {
				await editor.insertBlock( contentBindingHeadingBlock );
				const headingBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Heading',
				} );
				const headingContent = await headingBlock.textContent();
				expect( headingContent ).toBe( textCustomFieldKey );
			} );

			test( 'Should lock the appropriate controls', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( contentBindingHeadingBlock );
				const headingBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Heading',
				} );
				await headingBlock.click();

				// Alignment controls exist.
				await expect(
					page.getByRole( 'button', {
						name: alignName,
					} )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page.getByRole( 'button', {
						name: boldName,
					} )
				).toBeHidden();

				// Heading is not editable.
				const isContentEditable =
					await headingBlock.getAttribute( 'contenteditable' );
				expect( isContentEditable ).toBe( 'false' );
			} );
		} );

		test.describe( 'Button', () => {
			test( 'Should show the key of the custom field when text is bound', async ( {
				editor,
			} ) => {
				await editor.insertBlock( textBindingButtonBlock );
				const buttonBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Button',
					exact: true,
				} );
				const buttonText = await buttonBlock.textContent();
				expect( buttonText ).toBe( textCustomFieldKey );
			} );

			test( 'Should lock text controls when text is bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( textBindingButtonBlock );
				const buttonBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Button',
					exact: true,
				} );
				await buttonBlock.click();

				// Alignment controls exist.
				await expect(
					page.getByRole( 'button', {
						name: alignName,
					} )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page.getByRole( 'button', {
						name: boldName,
					} )
				).toBeHidden();

				// Button is not editable.
				const isContentEditable = await buttonBlock
					.locator( 'div' )
					.getAttribute( 'contenteditable' );
				expect( isContentEditable ).toBe( 'false' );

				// Link controls exist.
				await expect(
					page
						.getByRole( 'toolbar', { name: 'Block tools' } )
						.getByRole( 'button', { name: 'Unlink' } )
				).toBeVisible();
			} );

			test( 'Should lock url controls when url is bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( urlBindingButtonBlock );
				const buttonBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Button',
					exact: true,
				} );
				await buttonBlock.click();

				// Format controls exist.
				await expect(
					page.getByRole( 'button', {
						name: boldName,
					} )
				).toBeVisible();

				// Button is editable.
				const isContentEditable = await buttonBlock
					.locator( 'div' )
					.getAttribute( 'contenteditable' );
				expect( isContentEditable ).toBe( 'true' );

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
				await editor.insertBlock( multipleBindingsButtonBlock );
				const buttonBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Button',
					exact: true,
				} );
				await buttonBlock.click();

				// Alignment controls are visible.
				await expect(
					page.getByRole( 'button', {
						name: alignName,
					} )
				).toBeVisible();

				// Format controls don't exist.
				await expect(
					page.getByRole( 'button', {
						name: boldName,
					} )
				).toBeHidden();

				// Button is not editable.
				const isContentEditable = await buttonBlock
					.locator( 'div' )
					.getAttribute( 'contenteditable' );
				expect( isContentEditable ).toBe( 'false' );

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

			test( 'Should NOT show the upload form when url is bound', async ( {
				editor,
			} ) => {
				await editor.insertBlock( urlBindingImageBlock );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();
				await expect(
					imageBlock.getByRole( 'button', { name: 'Upload' } )
				).toBeHidden();
			} );

			test( 'Should lock url controls when url is bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( urlBindingImageBlock );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls don't exist.
				await expect(
					page.getByRole( 'button', {
						name: imageReplaceName,
					} )
				).toBeHidden();

				// Image placeholder doesn't show the upload button.
				await expect(
					imageBlock.getByRole( 'button', { name: 'Upload' } )
				).toBeHidden();

				// Alt textarea is enabled and with the original value.
				await expect( page.getByLabel( imageAltLabel ) ).toBeEnabled();
				const altValue = await page
					.getByLabel( imageAltLabel )
					.inputValue();
				expect( altValue ).toBe( 'a' );

				// Title input is enabled and with the original value.
				await page.getByRole( 'button', { name: 'Advanced' } ).click();
				await expect(
					page.getByLabel( imageTitleLabel )
				).toBeEnabled();
				const titleValue = await page
					.getByLabel( imageTitleLabel )
					.inputValue();
				expect( titleValue ).toBe( 't' );
			} );

			test( 'Should disable alt textarea when alt is bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( altBindingImageBlock );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls exist.
				await expect(
					page.getByRole( 'button', {
						name: imageReplaceName,
					} )
				).toBeVisible();

				// Alt textarea is disabled and with the custom field value.
				await expect( page.getByLabel( imageAltLabel ) ).toBeDisabled();
				const altValue = await page
					.getByLabel( imageAltLabel )
					.inputValue();
				expect( altValue ).toBe( textCustomFieldKey );

				// Title input is enabled and with the original value.
				await page.getByRole( 'button', { name: 'Advanced' } ).click();
				await expect(
					page.getByLabel( imageTitleLabel )
				).toBeEnabled();
				const titleValue = await page
					.getByLabel( imageTitleLabel )
					.inputValue();
				expect( titleValue ).toBe( 't' );
			} );

			test( 'Should disable title input when title is bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( titleBindingImageBlock );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls exist.
				await expect(
					page.getByRole( 'button', {
						name: imageReplaceName,
					} )
				).toBeVisible();

				// Alt textarea is enabled and with the original value.
				await expect( page.getByLabel( imageAltLabel ) ).toBeEnabled();
				const altValue = await page
					.getByLabel( imageAltLabel )
					.inputValue();
				expect( altValue ).toBe( 'a' );

				// Title input is disabled and with the custom field value.
				await page.getByRole( 'button', { name: 'Advanced' } ).click();
				await expect(
					page.getByLabel( imageTitleLabel )
				).toBeDisabled();
				const titleValue = await page
					.getByLabel( imageTitleLabel )
					.inputValue();
				expect( titleValue ).toBe( textCustomFieldKey );
			} );

			test( 'Multiple bindings should lock the appropriate controls', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( multipleBindingsImageBlock );
				const imageBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Image',
				} );
				await imageBlock.click();

				// Replace controls don't exist.
				await expect(
					page.getByRole( 'button', {
						name: imageReplaceName,
					} )
				).toBeHidden();

				// Image placeholder doesn't show the upload button.
				await expect(
					imageBlock.getByRole( 'button', { name: 'Upload' } )
				).toBeHidden();

				// Alt textarea is disabled and with the custom field value.
				await expect( page.getByLabel( imageAltLabel ) ).toBeDisabled();
				const altValue = await page
					.getByLabel( imageAltLabel )
					.inputValue();
				expect( altValue ).toBe( textCustomFieldKey );

				// Title input is enabled and with the original value.
				await page.getByRole( 'button', { name: 'Advanced' } ).click();
				await expect(
					page.getByLabel( imageTitleLabel )
				).toBeEnabled();
				const titleValue = await page
					.getByLabel( imageTitleLabel )
					.inputValue();
				expect( titleValue ).toBe( 't' );
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
			} ) => {
				await editor.insertBlock( contentBindingParagraphBlock );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				const paragraphContent = await paragraphBlock.textContent();
				expect( paragraphContent ).toBe( textCustomFieldValue );
				// Paragraph is not editable.
				const isContentEditable =
					await paragraphBlock.getAttribute( 'contenteditable' );
				expect( isContentEditable ).toBe( 'false' );
			} );

			test( "Should show the value of the key when custom field doesn't exists", async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
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
				const paragraphContent = await paragraphBlock.textContent();
				expect( paragraphContent ).toBe( 'non_existing_custom_field' );
				// Paragraph is not editable.
				const isContentEditable =
					await paragraphBlock.getAttribute( 'contenteditable' );
				expect( isContentEditable ).toBe( 'false' );
			} );
		} );

		test( 'Heading - should show the value of the custom field', async ( {
			editor,
		} ) => {
			await editor.insertBlock( contentBindingHeadingBlock );
			const headingBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Heading',
			} );
			const headingContent = await headingBlock.textContent();
			expect( headingContent ).toBe( textCustomFieldValue );
			// Heading is not editable.
			const isContentEditable =
				await headingBlock.getAttribute( 'contenteditable' );
			expect( isContentEditable ).toBe( 'false' );
		} );

		test( 'Button - should show the value of the custom field when text is bound', async ( {
			editor,
		} ) => {
			await editor.insertBlock( textBindingButtonBlock );
			const buttonBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Button',
				exact: true,
			} );
			await buttonBlock.click();
			const buttonText = await buttonBlock.textContent();
			expect( buttonText ).toBe( textCustomFieldValue );

			// Button is not editable.
			const isContentEditable = await buttonBlock
				.locator( 'div' )
				.getAttribute( 'contenteditable' );
			expect( isContentEditable ).toBe( 'false' );
		} );

		test.describe( 'Image', () => {
			let customFieldSrc;
			test.beforeAll( async ( { requestUtils } ) => {
				const customFieldMedia = await requestUtils.uploadMedia(
					path.join(
						'./test/e2e/assets',
						'1024x768_e2e_test_image_size.jpeg'
					)
				);
				customFieldSrc = customFieldMedia.source_url;
			} );

			test.beforeEach( async ( { editor, page, requestUtils } ) => {
				const postId = await editor.publishPost();
				await requestUtils.rest( {
					method: 'POST',
					path: '/wp/v2/posts/' + postId,
					data: {
						meta: {
							url_custom_field: customFieldSrc,
						},
					},
				} );
				await page.reload();
			} );
			test( 'Should show the value of the custom field when url is bound', async ( {
				editor,
			} ) => {
				await editor.insertBlock( urlBindingImageBlock );
				const imageBlockImg = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Image',
					} )
					.locator( 'img' );
				const imageSrc = await imageBlockImg.getAttribute( 'src' );
				expect( imageSrc ).toBe( customFieldSrc );
			} );

			test( 'Should show value of the custom field in the alt textarea when alt is bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( altBindingImageBlock );
				const imageBlockImg = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Image',
					} )
					.locator( 'img' );
				await imageBlockImg.click();

				// Image src is the placeholder.
				const imageSrc = await imageBlockImg.getAttribute( 'src' );
				expect( imageSrc ).toBe( placeholderSrc );

				// Alt textarea is disabled and with the custom field value.
				await expect( page.getByLabel( imageAltLabel ) ).toBeDisabled();
				const altValue = await page
					.getByLabel( imageAltLabel )
					.inputValue();
				expect( altValue ).toBe( textCustomFieldValue );
			} );

			test( 'Should show value of the custom field in the title input when title is bound', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( titleBindingImageBlock );
				const imageBlockImg = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Image',
					} )
					.locator( 'img' );
				await imageBlockImg.click();

				// Image src is the placeholder.
				const imageSrc = await imageBlockImg.getAttribute( 'src' );
				expect( imageSrc ).toBe( placeholderSrc );

				// Title input is disabled and with the custom field value.
				await page.getByRole( 'button', { name: 'Advanced' } ).click();
				await expect(
					page.getByLabel( imageTitleLabel )
				).toBeDisabled();
				const titleValue = await page
					.getByLabel( imageTitleLabel )
					.inputValue();
				expect( titleValue ).toBe( textCustomFieldValue );
			} );

			test( 'Multiple bindings should show the value of the custom fields', async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( multipleBindingsImageBlock );
				const imageBlockImg = editor.canvas
					.getByRole( 'document', {
						name: 'Block: Image',
					} )
					.locator( 'img' );
				await imageBlockImg.click();

				// Image src is the custom field value.
				const imageSrc = await imageBlockImg.getAttribute( 'src' );
				expect( imageSrc ).toBe( customFieldSrc );

				// Alt textarea is disabled and with the custom field value.
				await expect( page.getByLabel( imageAltLabel ) ).toBeDisabled();
				const altValue = await page
					.getByLabel( imageAltLabel )
					.inputValue();
				expect( altValue ).toBe( textCustomFieldValue );

				// Title input is enabled and with the original value.
				await page.getByRole( 'button', { name: 'Advanced' } ).click();
				await expect(
					page.getByLabel( imageTitleLabel )
				).toBeEnabled();
				const titleValue = await page
					.getByLabel( imageTitleLabel )
					.inputValue();
				expect( titleValue ).toBe( 't' );
			} );
		} );
	} );
} );
