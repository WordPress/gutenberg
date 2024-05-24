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
			// Block gets automatic padding when a background is set on the instance.
			await expect( block ).toHaveCSS( 'padding', '20px 38px' );

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
				fontWeight: '100',
				fontSize: '11px',
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

			// fontStyle, fontWeight, fontSize.
			await expect( block ).toHaveCSS(
				'font',
				'100 11px / 12.1px Times'
			);
			await expect( block ).toHaveCSS( 'text-transform', 'uppercase' );
			await expect( block ).toHaveCSS( 'letter-spacing', '1.1px' );
			await expect( block ).toHaveCSS( 'line-height', '12.1px' );
		} );

		await test.step( 'Global block styles', async () => {
			const styles = {
				typography: {
					fontWeight: '200',
					fontSize: '12px',
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

			// fontStyle, fontWeight, fontSize.
			await expect( block ).toHaveCSS(
				'font',
				'200 12px / 14.4px Times'
			);
			await expect( block ).toHaveCSS( 'text-transform', 'lowercase' );
			await expect( block ).toHaveCSS( 'letter-spacing', '1.2px' );
			await expect( block ).toHaveCSS(
				'text-decoration',
				'underline solid rgb(0, 0, 0)'
			);
			await expect( block ).toHaveCSS( 'line-height', '14.4px' );
		} );

		await test.step( 'Block instance styles', async () => {
			const style = {
				typography: {
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
					fontSize: '13px',
				},
			} );

			const block = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );

			// fontStyle, fontWeight, fontSize.
			await expect( block ).toHaveCSS(
				'font',
				'300 12px / 15.6px Times'
			);
			await expect( block ).toHaveCSS( 'text-transform', 'capitalize' );
			await expect( block ).toHaveCSS( 'letter-spacing', '1.3px' );
			await expect( block ).toHaveCSS(
				'text-decoration',
				'line-through solid rgb(0, 0, 0)'
			);
			await expect( block ).toHaveCSS( 'line-height', '15.6px' );
		} );
	} );

	test( 'Spacing', async ( { admin, editor, requestUtils } ) => {
		await test.step( 'Global block styles', async () => {
			const globalBlockStyles = {
				spacing: {
					margin: {
						top: '1px',
						bottom: '2px',
					},
					padding: {
						top: '3px',
						right: '4px',
						bottom: '5px',
						left: '6px',
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
					content: 'Paragraph 1',
				},
			} );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Paragraph 2',
				},
			} );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Paragraph 3',
				},
			} );

			const paragraphs = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );

			// Left/right margin is set to auto by alignments, there's no reliable way to test this.
			// First block will have its top margin set to zero by the layout.
			await expect( paragraphs.first() ).toHaveCSS( 'margin-top', '0px' );
			await expect( paragraphs.first() ).toHaveCSS(
				'margin-bottom',
				'2px'
			);
			await expect( paragraphs.first() ).toHaveCSS(
				'padding',
				'3px 4px 5px 6px'
			);

			// Second block will have the correct top and bottom margin.
			await expect( paragraphs.nth( 1 ) ).toHaveCSS(
				'margin-top',
				'1px'
			);
			await expect( paragraphs.nth( 1 ) ).toHaveCSS(
				'margin-bottom',
				'2px'
			);
			await expect( paragraphs.nth( 1 ) ).toHaveCSS(
				'padding',
				'3px 4px 5px 6px'
			);

			// Last block will have its bottom margin set to zero by the layout.
			await expect( paragraphs.last() ).toHaveCSS( 'margin-top', '1px' );
			await expect( paragraphs.last() ).toHaveCSS(
				'margin-bottom',
				'0px'
			);
			await expect( paragraphs.last() ).toHaveCSS(
				'padding',
				'3px 4px 5px 6px'
			);
		} );

		await test.step( 'Block instance styles', async () => {
			const instanceStyles = {
				spacing: {
					margin: {
						top: '11px',
						bottom: '12px',
					},
					padding: {
						top: '13px',
						right: '14px',
						bottom: '15px',
						left: '16px',
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

			// Left/right margin is set to auto by alignments, there's no reliable way to test this.
			await expect( block ).toHaveCSS( 'margin-top', '11px' );
			await expect( block ).toHaveCSS( 'margin-bottom', '12px' );
			await expect( block ).toHaveCSS( 'padding', '13px 14px 15px 16px' );
		} );
	} );
} );
