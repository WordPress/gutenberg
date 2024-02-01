/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const textCustomFieldValue = 'Value of the text_custom_field';
const textCustomFieldKey = 'text_custom_field';
// TODO: Replace with test images.
const urlCustomFieldValue =
	'https://wpmovies.dev/wp-content/uploads/2023/03/3bhkrj58Vtu7enYsRolD1fZdja1-683x1024.jpg';
const imagePlaceholder =
	'https://wpmovies.dev/wp-content/uploads/2023/04/goncharov-poster-original-1-682x1024.jpeg';

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
const urlBindingImageBlock = {
	name: 'core/image',
	attributes: {
		url: imagePlaceholder,
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
const altBindingImageBlock = {
	name: 'core/image',
	attributes: {
		url: imagePlaceholder,
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
const titleBindingImageBlock = {
	name: 'core/image',
	attributes: {
		url: imagePlaceholder,
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
const multipleBindingsImageBlock = {
	name: 'core/image',
	attributes: {
		url: imagePlaceholder,
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
// Image variables.
const imageReplaceName = 'Replace';
const imageAltLabel = 'Alternative text';
const imageTitleLabel = 'Title attribute';

test.describe( 'Block bindings - Post/page context', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	// Paragraph block tests.
	test( 'Paragraph - should show the value of the custom field when exists', async ( {
		editor,
	} ) => {
		await editor.insertBlock( contentBindingParagraphBlock );
		const paragraphBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const paragraphContent = await paragraphBlock.textContent();
		expect( paragraphContent ).toBe( textCustomFieldValue );
	} );

	test( "Paragraph - should show the value of the key when custom field doesn't exists", async ( {
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
	} );

	test( 'Paragraph - should lock the appropriate controls', async ( {
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

	// Heading block tests.
	test( 'Heading - should show the value of the custom field', async ( {
		editor,
	} ) => {
		await editor.insertBlock( contentBindingHeadingBlock );
		const headingBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		const headingContent = await headingBlock.textContent();
		expect( headingContent ).toBe( textCustomFieldValue );
	} );

	test( 'Heading - should lock the appropriate controls', async ( {
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

	// Button block tests.
	test( 'Button - should show the value of the custom field when text is bound', async ( {
		editor,
	} ) => {
		await editor.insertBlock( textBindingButtonBlock );
		const buttonBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Button',
			exact: true,
		} );
		const buttonText = await buttonBlock.textContent();
		expect( buttonText ).toBe( textCustomFieldValue );
	} );

	test( 'Button - should lock text controls when text is bound', async ( {
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

	test( 'Button - should lock url controls when url is bound', async ( {
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

		// Link controls doesn't exist.
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

	test( 'Button - should lock url and text controls when both are bound', async ( {
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

		// Link controls doesn't exist.
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

	// Image block tests.
	test( 'Image - should show the value of the custom field when url is bound', async ( {
		editor,
	} ) => {
		await editor.insertBlock( urlBindingImageBlock );
		const imageBlockImg = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Image',
			} )
			.locator( 'img' );
		const imageSrc = await imageBlockImg.getAttribute( 'src' );
		expect( imageSrc ).toBe( urlCustomFieldValue );
	} );

	test( 'Image - should lock url controls when url is bound', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( urlBindingImageBlock );
		const imageBlockImg = editor.canvas
			.getByRole( 'document', {
				name: 'Block: Image',
			} )
			.locator( 'img' );
		await imageBlockImg.click();

		// Replace controls doesn't exist.
		await expect(
			page.getByRole( 'button', {
				name: imageReplaceName,
			} )
		).toBeHidden();

		// Image src is the custom field value.
		const imageSrc = await imageBlockImg.getAttribute( 'src' );
		expect( imageSrc ).toBe( urlCustomFieldValue );

		// Alt textarea is enabled and with the original value.
		await expect( page.getByLabel( imageAltLabel ) ).toBeEnabled();
		const altValue = await page.getByLabel( imageAltLabel ).inputValue();
		expect( altValue ).toBe( 'a' );

		// Title input is enabled and with the original value.
		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		await expect( page.getByLabel( imageTitleLabel ) ).toBeEnabled();
		const titleValue = await page
			.getByLabel( imageTitleLabel )
			.inputValue();
		expect( titleValue ).toBe( 't' );
	} );

	test( 'Image - should disable alt textarea when alt is bound', async ( {
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

		// Replace controls exist.
		await expect(
			page.getByRole( 'button', {
				name: imageReplaceName,
			} )
		).toBeVisible();

		// Image src is the placeholder.
		const imageSrc = await imageBlockImg.getAttribute( 'src' );
		expect( imageSrc ).toBe( imagePlaceholder );

		// Alt textarea is disabled and with the custom field value.
		await expect( page.getByLabel( imageAltLabel ) ).toBeDisabled();
		const altValue = await page.getByLabel( imageAltLabel ).inputValue();
		expect( altValue ).toBe( textCustomFieldValue );

		// Title input is enabled and with the original value.
		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		await expect( page.getByLabel( imageTitleLabel ) ).toBeEnabled();
		const titleValue = await page
			.getByLabel( imageTitleLabel )
			.inputValue();
		expect( titleValue ).toBe( 't' );
	} );

	test( 'Image - should disable title input when title is bound', async ( {
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

		// Replace controls exist.
		await expect(
			page.getByRole( 'button', {
				name: imageReplaceName,
			} )
		).toBeVisible();

		// Image src is the placeholder.
		const imageSrc = await imageBlockImg.getAttribute( 'src' );
		expect( imageSrc ).toBe( imagePlaceholder );

		// Alt textarea is enabled and with the original value.
		await expect( page.getByLabel( imageAltLabel ) ).toBeEnabled();
		const altValue = await page.getByLabel( imageAltLabel ).inputValue();
		expect( altValue ).toBe( 'a' );

		// Title input is disabled and with the custom field value.
		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		await expect( page.getByLabel( imageTitleLabel ) ).toBeDisabled();
		const titleValue = await page
			.getByLabel( imageTitleLabel )
			.inputValue();
		expect( titleValue ).toBe( textCustomFieldValue );
	} );

	test( 'Image - multiple bindings should lock the appropriate controls', async ( {
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

		// Replace controls doesn't exist.
		await expect(
			page.getByRole( 'button', {
				name: imageReplaceName,
			} )
		).toBeHidden();

		// Image src is the custom field value.
		const imageSrc = await imageBlockImg.getAttribute( 'src' );
		expect( imageSrc ).toBe( urlCustomFieldValue );

		// Alt textarea is disabled and with the custom field value.
		await expect( page.getByLabel( imageAltLabel ) ).toBeDisabled();
		const altValue = await page.getByLabel( imageAltLabel ).inputValue();
		expect( altValue ).toBe( textCustomFieldValue );

		// Title input is enabled and with the original value.
		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		await expect( page.getByLabel( imageTitleLabel ) ).toBeEnabled();
		const titleValue = await page
			.getByLabel( imageTitleLabel )
			.inputValue();
		expect( titleValue ).toBe( 't' );
	} );
} );

test.describe( 'Block bindings - Template context', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );
		await editor.canvas.locator( 'body' ).click();
		await editor.openDocumentSettingsSidebar();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	// Paragraph block tests.
	test( 'Paragraph - should show the value of the custom field', async ( {
		editor,
	} ) => {
		await editor.insertBlock( contentBindingParagraphBlock );
		const paragraphBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const paragraphContent = await paragraphBlock.textContent();
		expect( paragraphContent ).toBe( textCustomFieldKey );
	} );

	test( 'Paragraph - should lock the appropriate controls', async ( {
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

	// Heading block tests.
	test( 'Heading - should show the value of the custom field', async ( {
		editor,
	} ) => {
		await editor.insertBlock( contentBindingHeadingBlock );
		const headingBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		const headingContent = await headingBlock.textContent();
		expect( headingContent ).toBe( textCustomFieldKey );
	} );

	test( 'Heading - should lock the appropriate controls', async ( {
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

	// Button block tests.
	test( 'Button - should show the value of the custom field when text is bound', async ( {
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

	test( 'Button - should lock text controls when text is bound', async ( {
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

	test( 'Button - should lock url controls when url is bound', async ( {
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

		// Link controls doesn't exist.
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

	test( 'Button - should lock url and text controls when both are bound', async ( {
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

		// Link controls doesn't exist.
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

	// Image block tests.
	test( 'Image - should show the upload form when url is not bound', async ( {
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

	test( 'Image - should NOT show the upload form when url is bound', async ( {
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

	test( 'Image - should lock url controls when url is bound', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( urlBindingImageBlock );
		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await imageBlock.click();

		// Replace controls doesn't exist.
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
		const altValue = await page.getByLabel( imageAltLabel ).inputValue();
		expect( altValue ).toBe( 'a' );

		// Title input is enabled and with the original value.
		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		await expect( page.getByLabel( imageTitleLabel ) ).toBeEnabled();
		const titleValue = await page
			.getByLabel( imageTitleLabel )
			.inputValue();
		expect( titleValue ).toBe( 't' );
	} );

	test( 'Image - should disable alt textarea when alt is bound', async ( {
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
		const altValue = await page.getByLabel( imageAltLabel ).inputValue();
		expect( altValue ).toBe( textCustomFieldKey );

		// Title input is enabled and with the original value.
		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		await expect( page.getByLabel( imageTitleLabel ) ).toBeEnabled();
		const titleValue = await page
			.getByLabel( imageTitleLabel )
			.inputValue();
		expect( titleValue ).toBe( 't' );
	} );

	test( 'Image - should disable title input when title is bound', async ( {
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
		const altValue = await page.getByLabel( imageAltLabel ).inputValue();
		expect( altValue ).toBe( 'a' );

		// Title input is disabled and with the custom field value.
		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		await expect( page.getByLabel( imageTitleLabel ) ).toBeDisabled();
		const titleValue = await page
			.getByLabel( imageTitleLabel )
			.inputValue();
		expect( titleValue ).toBe( textCustomFieldKey );
	} );

	test( 'Image - multiple bindings should lock the appropriate controls', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( multipleBindingsImageBlock );
		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await imageBlock.click();

		// Replace controls doesn't exist.
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
		const altValue = await page.getByLabel( imageAltLabel ).inputValue();
		expect( altValue ).toBe( textCustomFieldKey );

		// Title input is enabled and with the original value.
		await page.getByRole( 'button', { name: 'Advanced' } ).click();
		await expect( page.getByLabel( imageTitleLabel ) ).toBeEnabled();
		const titleValue = await page
			.getByLabel( imageTitleLabel )
			.inputValue();
		expect( titleValue ).toBe( 't' );
	} );
} );
