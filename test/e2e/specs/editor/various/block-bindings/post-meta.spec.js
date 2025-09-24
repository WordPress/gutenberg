/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Meta source', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme(
			'gutenberg-test-themes/block-bindings'
		);
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.describe( 'Movie CPT template', () => {
		test.beforeEach( async ( { admin, editor } ) => {
			await admin.visitSiteEditor( {
				postId: 'gutenberg-test-themes/block-bindings//single-movie',
				postType: 'wp_template',
				canvas: 'edit',
			} );
			await editor.openDocumentSettingsSidebar();
		} );

		test.describe( 'Block attributes values', () => {
			test( 'should not be possible to edit connected blocks', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'fallback content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: {
										key: 'movie_field',
									},
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
					'false'
				);
			} );
			test( 'should show the default value if it is defined', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'fallback content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: {
										key: 'movie_field',
									},
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await expect( paragraphBlock ).toHaveText(
					'Movie field default value'
				);
			} );
			test( 'should fall back to the field label if the default value is not defined', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'fallback content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: {
										key: 'field_with_only_label',
									},
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await expect( paragraphBlock ).toHaveText(
					'Field with only label'
				);
			} );
			test( 'should fall back to the field key if the field label is not defined', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'fallback content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: {
										key: 'field_without_label_or_default',
									},
								},
							},
						},
					},
				} );
				const paragraphBlock = editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} );
				await expect( paragraphBlock ).toHaveText(
					'field_without_label_or_default'
				);
			} );
		} );

		test.describe( 'Attributes panel', () => {
			test( 'should show the field label if it is defined', async ( {
				editor,
				page,
			} ) => {
				/**
				 * Create connection manually until this issue is solved:
				 * https://github.com/WordPress/gutenberg/pull/65604
				 *
				 * Once solved, block with the binding can be directly inserted.
				 */
				await editor.insertBlock( {
					name: 'core/paragraph',
				} );
				await page.getByLabel( 'Attributes options' ).click();
				await page
					.getByRole( 'menuitemcheckbox', {
						name: 'Show content',
					} )
					.click();
				const contentBinding = page.getByRole( 'button', {
					name: 'content',
				} );
				await contentBinding.click();
				await page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: 'Movie field label' } )
					.click();
				await expect( contentBinding ).toContainText(
					'Movie field label'
				);
			} );
			test( 'should fall back to the field key if the field label is not defined', async ( {
				editor,
				page,
			} ) => {
				/**
				 * Create connection manually until this issue is solved:
				 * https://github.com/WordPress/gutenberg/pull/65604
				 *
				 * Once solved, block with the binding can be directly inserted.
				 */
				await editor.insertBlock( {
					name: 'core/paragraph',
				} );
				await page.getByLabel( 'Attributes options' ).click();
				await page
					.getByRole( 'menuitemcheckbox', {
						name: 'Show content',
					} )
					.click();
				const contentBinding = page.getByRole( 'button', {
					name: 'content',
				} );
				await contentBinding.click();
				await page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: 'field_without_label_or_default' } )
					.click();
				await expect( contentBinding ).toContainText(
					'field_without_label_or_default'
				);
			} );
		} );

		test.describe( 'Fields list dropdown', () => {
			// Insert block and open the dropdown for every test.
			test.beforeEach( async ( { editor, page } ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
				} );
				await page.getByLabel( 'Attributes options' ).click();
				await page
					.getByRole( 'menuitemcheckbox', {
						name: 'Show content',
					} )
					.click();
				await page
					.getByRole( 'button', {
						name: 'content',
					} )
					.click();
			} );

			test( 'should include movie fields in UI to connect attributes', async ( {
				page,
			} ) => {
				const movieField = page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: 'Movie field label' } );
				await expect( movieField ).toBeVisible();
			} );
			test( 'should include global fields in UI to connect attributes', async ( {
				page,
			} ) => {
				const globalField = page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: 'text_custom_field' } );
				await expect( globalField ).toBeVisible();
			} );
			test( 'should not include protected fields', async ( { page } ) => {
				// Ensure the fields have loaded by checking the field is visible.
				const globalField = page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: 'text_custom_field' } );
				await expect( globalField ).toBeVisible();
				// Check the protected fields are not visible.
				const protectedField = page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: '_protected_field' } );
				await expect( protectedField ).toBeHidden();
				const showInRestFalseField = page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: 'show_in_rest_false_field' } );
				await expect( showInRestFalseField ).toBeHidden();
			} );
			test( 'should show the default value if it is defined', async ( {
				page,
			} ) => {
				const fieldButton = page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: 'Movie field label' } );
				await expect( fieldButton ).toContainText(
					'Movie field default value'
				);
			} );
			test( 'should not show anything if the default value is not defined', async ( {
				page,
			} ) => {
				const fieldButton = page
					.getByRole( 'menuitemradio' )
					.filter( { hasText: 'Field with only label' } );
				// Check it only contains the field label.
				await expect( fieldButton ).toHaveText(
					'Field with only label'
				);
			} );
		} );
	} );

	test.describe( 'Custom template', () => {
		test.beforeEach( async ( { admin, editor } ) => {
			await admin.visitSiteEditor( {
				postId: 'gutenberg-test-themes/block-bindings//custom-template',
				postType: 'wp_template',
				canvas: 'edit',
			} );
			await editor.openDocumentSettingsSidebar();
		} );

		test( 'should not include post meta fields in UI to connect attributes', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-meta',
								args: {
									key: 'text_custom_field',
								},
							},
						},
					},
				},
			} );
			await page
				.getByRole( 'button', {
					name: 'content',
				} )
				.click();
			// Check the fields registered by other sources are there.
			const customSourceField = page
				.getByRole( 'menuitemradio' )
				.filter( { hasText: 'Text Field Label' } );
			await expect( customSourceField ).toBeVisible();
			// Check the post meta fields are not visible.
			const globalField = page
				.getByRole( 'menuitemradio' )
				.filter( { hasText: 'text_custom_field' } );
			await expect( globalField ).toBeHidden();
			const movieField = page
				.getByRole( 'menuitemradio' )
				.filter( { hasText: 'Movie field label' } );
			await expect( movieField ).toBeHidden();
		} );
		test( 'should show the key in attributes connected to post meta', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-meta',
								args: {
									key: 'text_custom_field',
								},
							},
						},
					},
				},
			} );
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText( 'text_custom_field' );
		} );
	} );

	test.describe( 'Movie CPT post', () => {
		test.beforeEach( async ( { admin } ) => {
			// CHECK HOW TO CREATE A MOVIE.
			await admin.createNewPost( {
				postType: 'movie',
				title: 'Test bindings',
			} );
		} );

		test( 'should show the custom field value of that specific post', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					anchor: 'connected-paragraph',
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-meta',
								args: {
									key: 'movie_field',
								},
							},
						},
					},
				},
			} );
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText(
				'Movie field default value'
			);
			// Check the frontend shows the value of the custom field.
			const previewPage = await editor.openPreviewPage();
			await expect(
				previewPage.locator( '#connected-paragraph' )
			).toHaveText( 'Movie field default value' );
		} );
		test( 'should fall back to the key when custom field is not accessible', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-meta',
								args: {
									key: 'unaccessible_field',
								},
							},
						},
					},
				},
			} );
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText( 'unaccessible_field' );
			await expect( paragraphBlock ).toHaveAttribute(
				'contenteditable',
				'false'
			);
		} );
		test( 'should not show or edit the value of a protected field', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-meta',
								args: {
									key: '_protected_field',
								},
							},
						},
					},
				},
			} );
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText( '_protected_field' );
			await expect( paragraphBlock ).toHaveAttribute(
				'contenteditable',
				'false'
			);
		} );
		test( 'should not show or edit the value of a field with `show_in_rest` set to false', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-meta',
								args: {
									key: 'show_in_rest_false_field',
								},
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
			await expect( paragraphBlock ).toHaveAttribute(
				'contenteditable',
				'false'
			);
		} );
		test( 'should be possible to edit the value of the connected custom fields', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					anchor: 'connected-paragraph',
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-meta',
								args: {
									key: 'movie_field',
								},
							},
						},
					},
				},
			} );
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText(
				'Movie field default value'
			);
			await expect( paragraphBlock ).toHaveAttribute(
				'contenteditable',
				'true'
			);
			await paragraphBlock.fill( 'new value' );
			// Check that the paragraph content attribute didn't change.
			const [ paragraphBlockObject ] = await editor.getBlocks();
			expect( paragraphBlockObject.attributes.content ).toBe(
				'fallback content'
			);
			// Check the value of the custom field is being updated by visiting the frontend.
			const previewPage = await editor.openPreviewPage();
			await expect(
				previewPage.locator( '#connected-paragraph' )
			).toHaveText( 'new value' );
		} );

		test( 'should be possible to edit the value of the connected custom fields in the inspector control registered by the plugin', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					anchor: 'connected-paragraph',
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'core/post-meta',
								args: {
									key: 'movie_field',
								},
							},
						},
					},
				},
			} );
			const contentInput = page.getByRole( 'textbox', {
				name: 'Content',
			} );
			await expect( contentInput ).toHaveValue(
				'Movie field default value'
			);
			await contentInput.fill( 'new value' );
			// Check that the paragraph content attribute didn't change.
			const [ paragraphBlockObject ] = await editor.getBlocks();
			expect( paragraphBlockObject.attributes.content ).toBe(
				'fallback content'
			);
			// Check the value of the custom field is being updated by visiting the frontend.
			const previewPage = await editor.openPreviewPage();
			await expect(
				previewPage.locator( '#connected-paragraph' )
			).toHaveText( 'new value' );
		} );

		test( 'should be possible to connect movie fields through the attributes panel', async ( {
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
			await page
				.getByRole( 'button', {
					name: 'content',
				} )
				.click();
			const movieField = page
				.getByRole( 'menuitemradio' )
				.filter( { hasText: 'Movie field label' } );
			await expect( movieField ).toBeVisible();
		} );
		test( 'should not be possible to connect non-supported fields through the attributes panel', async ( {
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
			await page
				.getByRole( 'button', {
					name: 'content',
				} )
				.click();
			await expect(
				page.getByRole( 'menuitemradio', {
					name: 'String custom field',
				} )
			).toBeVisible();
			await expect(
				page.getByRole( 'menuitemradio', {
					name: 'Number custom field',
				} )
			).toBeHidden();
			await expect(
				page.getByRole( 'menuitemradio', {
					name: 'Integer custom field',
				} )
			).toBeHidden();
			await expect(
				page.getByRole( 'menuitemradio', {
					name: 'Boolean custom field',
				} )
			).toBeHidden();
			await expect(
				page.getByRole( 'menuitemradio', {
					name: 'Object custom field',
				} )
			).toBeHidden();
			await expect(
				page.getByRole( 'menuitemradio', {
					name: 'Array custom field',
				} )
			).toBeHidden();
		} );
	} );
} );
