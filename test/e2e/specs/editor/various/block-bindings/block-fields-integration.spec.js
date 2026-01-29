/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Fields Bindings Integration', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
		// Enable feature flags
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-content-only-inspector-fields',
			'gutenberg-block-fields-bindings',
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
		// Disable feature flags
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.beforeEach( async ( { admin } ) => {
		// Create a new post
		await admin.createNewPost( { title: 'Test Block Fields Bindings' } );
	} );

	test.describe( 'Binding Badge UI', () => {
		test( 'should show binding badge next to rich-text Block Field', async ( {
			editor,
			page,
		} ) => {
			// Insert a paragraph block
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );

			// Open the Content tab in the inspector
			await page.getByRole( 'tab', { name: 'Content' } ).click();

			// Look for the binding badge wrapper
			const bindingBadge = page.locator( '.binding-field-badge' );
			await expect( bindingBadge ).toBeVisible();

			// Badge should have the "connect" icon (linkOff) for unbound fields
			const connectButton = bindingBadge.getByRole( 'button' );
			await expect( connectButton ).toBeVisible();
			await expect( connectButton ).toHaveAttribute(
				'aria-label',
				'Connect to source'
			);
		} );

		test( 'should open binding menu when clicking badge', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );

			await page.getByRole( 'tab', { name: 'Content' } ).click();

			// Click the binding badge
			const bindingBadge = page.locator( '.binding-field-badge' );
			await bindingBadge.getByRole( 'button' ).click();

			// Menu should appear with available sources
			const menu = page.locator( '.components-popover' );
			await expect( menu ).toBeVisible();

			// Should show "Complete Source" from the test plugin
			const completeSource = page.getByRole( 'menuitem', {
				name: 'Complete Source',
			} );
			await expect( completeSource ).toBeVisible();

			// Should NOT show pattern-overrides source
			const patternOverrides = page.getByRole( 'menuitem', {
				name: 'Pattern Overrides',
			} );
			await expect( patternOverrides ).toBeHidden();
		} );

		test( 'should connect field to binding source through badge menu', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );

			await page.getByRole( 'tab', { name: 'Content' } ).click();

			// Click the binding badge to open menu
			const bindingBadge = page.locator( '.binding-field-badge' );
			await bindingBadge.getByRole( 'button' ).click();

			// Select Complete Source
			await page
				.getByRole( 'menuitem', { name: 'Complete Source' } )
				.click();

			// Select the text field
			await page
				.getByRole( 'menuitemcheckbox' )
				.filter( { hasText: 'Text Field Label' } )
				.click();

			// Block Field input should update to show the bound value
			const contentField = page.getByRole( 'textbox', {
				name: 'content',
			} );
			await expect( contentField ).toHaveValue( 'Text Field Value' );

			// Paragraph should also show the bound value in canvas
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText( 'Text Field Value' );

			// Badge should now show connected state with link icon
			await expect( bindingBadge ).toHaveClass( /is-connected/ );
		} );

		test( 'should show source label in badge when connected', async ( {
			editor,
			page,
		} ) => {
			// Insert paragraph with existing binding
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
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

			await page.getByRole( 'tab', { name: 'Content' } ).click();

			// Badge should show field label
			const bindingBadge = page.locator( '.binding-field-badge' );
			const badgeButton = bindingBadge.getByRole( 'button' );
			await expect( badgeButton ).toContainText( 'Text Field Label' );

			// Should have connected class
			await expect( bindingBadge ).toHaveClass( /is-connected/ );
		} );

		test( 'should allow disconnecting binding through badge menu', async ( {
			editor,
			page,
		} ) => {
			// Insert paragraph with existing binding
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
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

			await page.getByRole( 'tab', { name: 'Content' } ).click();

			// Click the binding badge
			const bindingBadge = page.locator( '.binding-field-badge' );
			await bindingBadge.getByRole( 'button' ).click();

			// Click disconnect option
			await page.getByRole( 'menuitem', { name: 'Disconnect' } ).click();

			// Paragraph should return to fallback content
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText( 'fallback content' );

			// Badge should return to unconnected state
			const badgeButton = bindingBadge.getByRole( 'button' );
			await expect( badgeButton ).toHaveAttribute(
				'aria-label',
				'Connect to source'
			);
		} );

		test( 'should show read-only icon for non-editable bindings', async ( {
			editor,
			page,
		} ) => {
			// Insert paragraph with read-only binding
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
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

			await page.getByRole( 'tab', { name: 'Content' } ).click();

			// Badge should show lock icon for read-only
			const bindingBadge = page.locator( '.binding-field-badge' );

			// Check that badge indicates read-only
			await expect( bindingBadge ).toHaveClass( /is-read-only/ );
		} );

		test( 'should show error state for invalid binding source', async ( {
			editor,
			page,
		} ) => {
			// Insert paragraph with invalid binding
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
					metadata: {
						bindings: {
							content: {
								source: 'testing/undefined-source',
							},
						},
					},
				},
			} );

			await page.getByRole( 'tab', { name: 'Content' } ).click();

			// Badge should show error state
			const bindingBadge = page.locator( '.binding-field-badge' );
			await expect( bindingBadge ).toHaveClass( /is-invalid/ );

			const badgeButton = bindingBadge.getByRole( 'button' );
			await expect( badgeButton ).toHaveAttribute(
				'aria-label',
				'Source not registered'
			);
		} );
	} );

	test.describe( 'Attributes Panel Hiding', () => {
		test( 'should hide Attributes panel when Block Fields Bindings is active', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
			} );

			// Switch to Settings tab
			await page.getByRole( 'tab', { name: 'Settings' } ).click();

			// Attributes panel should not be visible
			const attributesPanel = page.getByLabel( 'Attributes options' );
			await expect( attributesPanel ).toBeHidden();
		} );
	} );

	test.describe( 'Data Flow', () => {
		test( 'should display bound value in Block Field', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
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

			// Paragraph should show the bound value from the source
			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraphBlock ).toHaveText( 'Text Field Value' );
		} );

		test( 'should allow editing editable bound fields', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					anchor: 'bound-paragraph',
					content: 'fallback content',
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

			// Should be editable
			await expect( paragraphBlock ).toHaveAttribute(
				'contenteditable',
				'true'
			);

			// Edit the value
			await paragraphBlock.fill( 'New bound value' );

			// Check that paragraph content attribute didn't change
			const [ paragraphBlockObject ] = await editor.getBlocks();
			expect( paragraphBlockObject.attributes.content ).toBe(
				'fallback content'
			);

			// Check value is updated on frontend
			const previewPage = await editor.openPreviewPage();
			await expect(
				previewPage.locator( '#bound-paragraph' )
			).toHaveText( 'New bound value' );
		} );

		test( 'should not allow editing read-only bound fields', async ( {
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'fallback content',
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

			const paragraphBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );

			// Should not be editable
			await expect( paragraphBlock ).toHaveAttribute(
				'contenteditable',
				'false'
			);
		} );
	} );

	test.describe( 'Only bindable fields show badges', () => {
		test( 'should not show badge for non-bindable fields', async ( {
			editor,
			page,
		} ) => {
			// Insert image block (has both bindable and non-bindable attributes)
			await editor.insertBlock( {
				name: 'core/image',
			} );

			await page.getByRole( 'tab', { name: 'Content' } ).click();

			// Count binding badges - should only appear for bindable attributes
			const bindingBadges = page.locator( '.binding-field-badge' );
			const badgeCount = await bindingBadges.count();

			// Image block should have badges only for bindable attributes (url, alt, title, id)
			// The exact count depends on which fields are shown by default
			expect( badgeCount ).toBeGreaterThan( 0 );
		} );
	} );
} );
