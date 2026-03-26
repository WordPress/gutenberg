/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Background gradient block support', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// Switch to emptytheme so WordPress default gradient presets are
		// available (TwentyTwentyFive sets defaultGradients:false).
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'color.gradient read-through and migration', () => {
		// A custom gradient that does NOT match any WordPress preset so that
		// clicking a preset in the picker always performs a fresh selection
		// rather than a deselect of the already-active value.
		const LEGACY_GRADIENT =
			'linear-gradient(135deg,rgb(100,100,200) 0%,rgb(200,100,100) 100%)';

		test( 'block with legacy color.gradient loads without a deprecation warning', async ( {
			editor,
			page,
		} ) => {
			// Insert a group block with legacy style.color.gradient — simulating
			// content saved before background.gradient support was added.
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					style: {
						color: {
							gradient: LEGACY_GRADIENT,
						},
					},
				},
			} );

			// Block should be valid — no "Attempt Block Recovery" notice.
			await expect(
				page.getByRole( 'button', { name: 'Attempt Block Recovery' } )
			).toBeHidden();
		} );

		test( 'legacy color.gradient is shown in the background panel via read-through fallback', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					style: {
						color: {
							gradient: LEGACY_GRADIENT,
						},
					},
				},
			} );

			await editor.openDocumentSettingsSidebar();
			await page.getByRole( 'tab', { name: 'Styles' } ).click();

			// The gradient indicator in the Background panel should be visible,
			// meaning the color.gradient value surfaced via the read-through fallback.
			const backgroundGradientButton = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'button', { name: 'Gradient' } );

			await expect( backgroundGradientButton ).toBeVisible();

			// Gradient indicator should have a non-transparent background,
			// confirming the fallback value is being displayed.
			const indicator = backgroundGradientButton.locator(
				'.component-color-indicator'
			);
			await expect( indicator ).toBeVisible();
		} );

		test( 'migrates color.gradient to background.gradient and adds has-background when gradient is set', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					style: {
						color: {
							gradient: LEGACY_GRADIENT,
						},
					},
				},
			} );

			await editor.openDocumentSettingsSidebar();
			await page.getByRole( 'tab', { name: 'Styles' } ).click();

			// Open the gradient picker in the Background panel and select a
			// preset, which triggers the migration.
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Gradient' } )
				.click();
			await page
				.getByRole( 'option', { name: /Gradient: Vivid cyan blue/i } )
				.click();

			const [ block ] = await editor.getBlocks();

			// color.gradient must be cleared.
			expect( block.attributes.style?.color?.gradient ).toBeUndefined();

			// Gradient value must now live in background.gradient.
			expect( block.attributes.style?.background?.gradient ).toBeTruthy();

			// has-background must be added to className to preserve theme
			// styles that were relying on it from the old color.gradient support.
			expect( block.attributes.className ).toContain( 'has-background' );
		} );

		test( 'clears color.gradient without adding has-background when gradient is reset', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					style: {
						color: {
							gradient: LEGACY_GRADIENT,
						},
					},
				},
			} );

			await editor.openDocumentSettingsSidebar();
			await page.getByRole( 'tab', { name: 'Styles' } ).click();

			// Open the gradient picker and clear it. The inline reset icon
			// button (aria-label="Reset") is hidden until hover; using the
			// "Clear" button inside the picker is more reliable across pointer
			// environments.
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Gradient' } )
				.click();
			await page.getByRole( 'button', { name: 'Clear' } ).click();

			const [ block ] = await editor.getBlocks();

			// Both gradient paths must be cleared.
			expect( block.attributes.style?.color?.gradient ).toBeUndefined();
			expect(
				block.attributes.style?.background?.gradient
			).toBeUndefined();

			// has-background must NOT be added — no gradient is set, so the
			// class would add padding with no visual justification.
			// className may be undefined if never set; either way has-background
			// must not be present.
			expect( block.attributes.className ?? '' ).not.toContain(
				'has-background'
			);
		} );

		test( 'removes has-background class when gradient is reset after migration', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					style: {
						color: {
							gradient: LEGACY_GRADIENT,
						},
					},
				},
			} );

			await editor.openDocumentSettingsSidebar();
			await page.getByRole( 'tab', { name: 'Styles' } ).click();

			// First, trigger migration by selecting a preset gradient.
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Gradient' } )
				.click();
			await page
				.getByRole( 'option', { name: /Gradient: Vivid cyan blue/i } )
				.click();

			// Verify has-background was added during migration.
			const [ blockAfterMigration ] = await editor.getBlocks();
			expect( blockAfterMigration.attributes.className ).toContain(
				'has-background'
			);

			// Now clear the gradient — has-background must be removed.
			// Dismiss any open popover first so the next click reliably
			// *opens* the dropdown rather than toggling it closed.
			await page.keyboard.press( 'Escape' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Gradient' } )
				.click();
			await page.getByRole( 'button', { name: 'Clear' } ).click();

			const [ block ] = await editor.getBlocks();

			expect(
				block.attributes.style?.background?.gradient
			).toBeUndefined();
			expect( block.attributes.className ?? '' ).not.toContain(
				'has-background'
			);
		} );

		test( 'block remains valid after migration and re-save', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					style: {
						color: {
							gradient: LEGACY_GRADIENT,
						},
					},
				},
			} );

			await editor.openDocumentSettingsSidebar();
			await page.getByRole( 'tab', { name: 'Styles' } ).click();

			// Trigger migration by clearing the gradient via the picker.
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Gradient' } )
				.click();
			await page.getByRole( 'button', { name: 'Clear' } ).click();

			// Save the post.
			await editor.publishPost();

			// Reload and verify the block is still valid — no deprecation
			// recovery dialog should appear, proving no deprecation is needed.
			await page.reload();
			await expect(
				page.getByRole( 'button', { name: 'Attempt Block Recovery' } )
			).toBeHidden();
		} );
	} );
} );
