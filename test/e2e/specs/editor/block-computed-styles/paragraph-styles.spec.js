/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Paragraph computed styles', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.updateGlobalStyles( {} );
	} );

	test( 'Color', async ( { admin, editor, requestUtils } ) => {
		const globalElementStyles = {
			// A background color isn't set, as at this level it refers
			// to the template background not just text background.
			color: {
				text: 'rgb(10, 10, 10)',
			},
			elements: {
				link: {
					color: {
						text: 'rgb(110, 110, 110)',
					},
				},
			},
		};

		await test.step( 'Global element styles', async () => {
			await requestUtils.updateGlobalStyles( {
				...globalElementStyles,
			} );

			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello <a href="https://wordpress.org">world</a>',
				},
			} );

			const block = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( block ).toHaveCSS(
				'color',
				globalElementStyles.color.text
			);

			const link = block.getByRole( 'link' );
			await expect( link ).toHaveCSS(
				'color',
				globalElementStyles.elements.link.color.text
			);
		} );

		await test.step( 'Global block styles', async () => {
			const globalBlockStyles = {
				color: {
					text: 'rgb(11, 11, 11)',
					background: 'rgb(111, 111, 111)',
				},
				elements: {
					link: {
						color: {
							text: 'rgb(211, 211, 211)',
						},
					},
				},
			};

			// The test asserts that block type styles take precedence over
			// element styles so include them both in the global styles update.
			await requestUtils.updateGlobalStyles( {
				...globalElementStyles,
				blocks: {
					'core/paragraph': globalBlockStyles,
				},
			} );

			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello <a href="https://wordpress.org">world</a>',
				},
			} );

			const block = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( block ).toHaveCSS(
				'color',
				globalBlockStyles.color.text
			);
			await expect( block ).toHaveCSS(
				'background-color',
				globalBlockStyles.color.background
			);

			const link = block.getByRole( 'link' );
			await expect( link ).toHaveCSS(
				'color',
				globalBlockStyles.elements.link.color.text
			);
		} );

		await test.step( 'Block instance styles', async () => {
			const instanceStyles = {
				color: {
					text: 'rgb(12, 12, 12)',
					background: 'rgb(112, 112, 112)',
				},
				elements: {
					link: {
						color: {
							text: 'rgb(212, 212, 212)',
						},
					},
				},
			};

			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello <a href="https://wordpress.org">world</a>',
					style: instanceStyles,
				},
			} );

			const block = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( block ).toHaveCSS(
				'color',
				instanceStyles.color.text
			);
			await expect( block ).toHaveCSS(
				'background-color',
				instanceStyles.color.background
			);

			const link = block.getByRole( 'link' );
			await expect( link ).toHaveCSS(
				'color',
				instanceStyles.elements.link.color.text
			);
		} );
	} );

	test( 'Typography', async ( { admin, editor, requestUtils } ) => {
		const globalElementStyles = {
			typography: {
				fontSize: '11px',
				fontWeight: '100',
				textTransform: 'uppercase',
				letterSpacing: '1.1px',
				lineHeight: '1.1',
			},
		};

		await test.step( 'Global element styles', async () => {
			await requestUtils.updateGlobalStyles( {
				...globalElementStyles,
			} );

			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello <a href="https://wordpress.org">world</a>',
				},
			} );

			const block = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );

			await expect( block ).toHaveCSS( 'font-size', '11px' );
			await expect( block ).toHaveCSS( 'font-weight', '100' );
			await expect( block ).toHaveCSS( 'text-transform', 'uppercase' );
			await expect( block ).toHaveCSS( 'letter-spacing', '1.1px' );
			await expect( block ).toHaveCSS( 'line-height', '12.1px' );
		} );

		await test.step( 'Global block styles', async () => {
			const styles = {
				typography: {
					fontSize: '12px',
					fontWeight: '200',
					textTransform: 'lowercase',
					letterSpacing: '1.2px',
					textDecoration: 'underline',
					lineHeight: '1.2',
				},
			};

			// The test asserts that block type styles take precedence over
			// element styles so include them both in the global styles update.
			await requestUtils.updateGlobalStyles( {
				...globalElementStyles,
				blocks: {
					'core/paragraph': styles,
				},
			} );

			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello <a href="https://wordpress.org">world</a>',
				},
			} );

			const block = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );

			await expect( block ).toHaveCSS( 'font-size', '12px' );
			await expect( block ).toHaveCSS( 'font-weight', '200' );
			await expect( block ).toHaveCSS( 'text-transform', 'lowercase' );
			await expect( block ).toHaveCSS( 'letter-spacing', '1.2px' );
			await expect( block ).toHaveCSS(
				'text-decoration-line',
				'underline'
			);
			await expect( block ).toHaveCSS( 'line-height', '14.4px' );
		} );

		await test.step( 'Block instance styles', async () => {
			const style = {
				typography: {
					fontSize: '13px',
					fontWeight: '300',
					textTransform: 'capitalize',
					textDecoration: 'line-through',
					letterSpacing: '1.3px',
					lineHeight: '1.3',
				},
			};

			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
					style,
				},
			} );

			const block = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );

			await expect( block ).toHaveCSS( 'font-size', '13px' );
			await expect( block ).toHaveCSS( 'font-weight', '300' );
			await expect( block ).toHaveCSS( 'text-transform', 'capitalize' );
			await expect( block ).toHaveCSS( 'letter-spacing', '1.3px' );
			await expect( block ).toHaveCSS(
				'text-decoration-line',
				'line-through'
			);
			await expect( block ).toHaveCSS( 'line-height', '16.9px' );
		} );
	} );

	test( 'Spacing', async ( { admin, editor, requestUtils } ) => {
		await test.step( 'Global block styles', async () => {
			const globalBlockStyles = {
				spacing: {
					margin: {
						top: '1px',
						right: '2px',
						bottom: '3px',
						left: '4px',
					},
					padding: {
						top: '5px',
						right: '6px',
						bottom: '7px',
						left: '8px',
					},
				},
			};

			await requestUtils.updateGlobalStyles( {
				blocks: {
					'core/paragraph': globalBlockStyles,
				},
			} );

			await admin.createNewPost();

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Root Paragraph 1',
				},
			} );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Root Paragraph 2',
				},
			} );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Root Paragraph 3',
				},
			} );

			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const rootParagraph1 = paragraphs.nth( 0 );
			const rootParagraph2 = paragraphs.nth( 1 );
			const rootParagraph3 = paragraphs.nth( 2 );

			// Left/right margin is set to auto by alignments, there's no reliable way to test this.
			// First block will have its top margin set to zero by the layout.
			await expect( rootParagraph1 ).toHaveCSS( 'margin-top', '0px' );
			await expect( rootParagraph1 ).toHaveCSS( 'margin-bottom', '3px' );
			await expect( rootParagraph1 ).toHaveCSS(
				'padding',
				'5px 6px 7px 8px'
			);

			// Second block will have the correct top and bottom margin.
			await expect( rootParagraph2 ).toHaveCSS( 'margin-top', '1px' );
			await expect( rootParagraph2 ).toHaveCSS( 'margin-bottom', '3px' );
			await expect( rootParagraph2 ).toHaveCSS(
				'padding',
				'5px 6px 7px 8px'
			);

			// Last block will have its bottom margin set to zero by the layout.
			await expect( rootParagraph3 ).toHaveCSS( 'margin-top', '1px' );
			await expect( rootParagraph3 ).toHaveCSS( 'margin-bottom', '0px' );
			await expect( rootParagraph3 ).toHaveCSS(
				'padding',
				'5px 6px 7px 8px'
			);

			// Insert a nested paragraph. Do this after the other assertions
			// to not affect the start/end of the root paragraphs.
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					layout: {
						type: 'default',
					},
				},
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Nested Paragraph 1',
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Nested Paragraph 2',
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Nested Paragraph 3',
						},
					},
				],
			} );
			const nestedParagraph1 = paragraphs.nth( 3 );
			const nestedParagraph2 = paragraphs.nth( 4 );
			const nestedParagraph3 = paragraphs.nth( 5 );
			// In a default layout, the margins on left/right apply to the
			// middle paragraph.
			await expect( nestedParagraph1 ).toHaveCSS(
				'margin',
				'0px 2px 3px 4px'
			);
			await expect( nestedParagraph2 ).toHaveCSS(
				'margin',
				'1px 2px 3px 4px'
			);
			// Note: This is different to what I reproduce locally.
			// Bottom margin should be 0px for the last block.
			await expect( nestedParagraph3 ).toHaveCSS(
				'margin',
				'1px 2px 3px 4px'
			);

			// Expect a paragraph with a background color to have some
			// built-in default padding applied.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Paragraph with background',
					styles: { color: { background: '#2d2d2d' } },
				},
			} );
			const paragraphWithBackground = paragraphs.nth( 6 );
			await expect( paragraphWithBackground ).toHaveCSS(
				'padding',
				'20px 38px'
			);
		} );

		await test.step( 'Block instance styles', async () => {
			const instanceStyles = {
				spacing: {
					margin: {
						top: '11px',
						right: '12px',
						bottom: '13px',
						left: '14px',
					},
					padding: {
						top: '15px',
						right: '16px',
						bottom: '17px',
						left: '18px',
					},
				},
			};

			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello <a href="https://wordpress.org">world</a>',
					style: instanceStyles,
				},
			} );

			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			const rootParagraph = paragraphs.nth( 0 );

			// Left/right margin is set to auto by alignments, there's no reliable way to test this.
			// Block styles override the default start/end margin, so only one block is needed..
			await expect( rootParagraph ).toHaveCSS( 'margin-top', '11px' );
			await expect( rootParagraph ).toHaveCSS( 'margin-bottom', '13px' );
			await expect( rootParagraph ).toHaveCSS(
				'padding',
				'15px 16px 17px 18px'
			);

			// Insert a nested paragraph. Do this after the other assertions
			// to not affect the start/end of the root paragraphs.
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					layout: {
						type: 'default',
					},
				},
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Nested Paragraph 1',
							style: instanceStyles,
						},
					},
				],
			} );
			const nestedParagraph = paragraphs.nth( 1 );
			// In a default layout, the margins on left/right apply.
			await expect( nestedParagraph ).toHaveCSS(
				'margin',
				'11px 12px 13px 14px'
			);

			// Expect a paragraph with a background color to have its
			// built-in default padding overriden by instance styles.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Paragraph with background',
					styles: {
						color: { background: '#2d2d2d' },
						...instanceStyles,
					},
				},
			} );
			const paragraphWithBackground = paragraphs.nth( 2 );
			await expect( paragraphWithBackground ).toHaveCSS(
				'padding',
				'15px 16px 17px 18px'
			);
		} );
	} );
} );
