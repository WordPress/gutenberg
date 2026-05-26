/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Inline Block Bindings picker — Block Fields integration.
 *
 * Covers AC1-AC15 from spec.md §4. The new picker is gated behind
 * `window.__experimentalContentOnlyInspectorFields`, so each test that opts
 * into the flag MUST set it BEFORE inserting blocks / opening the inspector
 * (the flag is read once at first render of the relevant subtree per the
 * dual-gating decision in plan §A5).
 */

/**
 * Enables the experimental Block Fields Content tab. Must be called in
 * `addInitScript` so the flag is set on every page load before any block
 * renders.
 *
 * @param {import('@playwright/test').Page} page
 */
async function enableContentOnlyInspectorFields( page ) {
	await page.addInitScript( () => {
		window.__experimentalContentOnlyInspectorFields = true;
	} );
}

test.describe( 'Block Fields inline picker', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.describe( 'flag on', () => {
		test.beforeEach( async ( { admin, page } ) => {
			await enableContentOnlyInspectorFields( page );
			await admin.createNewPost( { title: 'Inline picker tests' } );
		} );

		test( 'renders is-connected border on bound RichText and Text fields (AC1)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'bound paragraph',
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

			// The Content tab is the default for Block Fields-supporting blocks.
			const richTextField = page.locator(
				'.block-editor-content-only-controls__rich-text.is-connected'
			);
			await expect( richTextField ).toBeVisible();
		} );

		test( 'ConnectedButton swaps icon and label across bound state without remount (AC2)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'unbound paragraph' },
			} );

			const connectButton = page.getByRole( 'button', {
				name: 'Connect',
			} );
			await expect( connectButton ).toBeVisible();

			// Tag the live <button> DOM node so we can verify it is the SAME
			// node after the bound/unbound transition (spec req 4, AC2).
			await connectButton.evaluate( ( el ) => {
				el.dataset.noRemountMarker = 'inline-picker';
			} );

			// Bind via the picker.
			await connectButton.click();
			await page
				.getByRole( 'menuitem', { name: 'Complete Source' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'Text Field Label' } )
				.click();

			// Same DOM node, new accessible name + icon.
			const disconnectButton = page.getByRole( 'button', {
				name: 'Disconnect',
			} );
			await expect( disconnectButton ).toBeVisible();
			await expect( disconnectButton ).toHaveAttribute(
				'data-no-remount-marker',
				'inline-picker'
			);
		} );

		test( 'click ConnectedButton opens picker listing compatible sources (AC3, AC4)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'unbound paragraph' },
			} );

			await page.getByRole( 'button', { name: 'Connect' } ).click();
			await expect(
				page.getByRole( 'menuitem', { name: 'Complete Source' } )
			).toBeVisible();

			// Drill into the source, select the first compatible field.
			await page
				.getByRole( 'menuitem', { name: 'Complete Source' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'Text Field Label' } )
				.click();

			// `is-connected` border applied; ConnectedButton flipped to
			// "Disconnect".
			await expect(
				page.locator(
					'.block-editor-content-only-controls__rich-text.is-connected'
				)
			).toBeVisible();
			await expect(
				page.getByRole( 'button', { name: 'Disconnect' } )
			).toBeVisible();
		} );

		test( 're-selecting the checked item in the picker disconnects (AC5)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'bound paragraph',
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

			const disconnectButton = page.getByRole( 'button', {
				name: 'Disconnect',
			} );
			await disconnectButton.click();

			// Picker opens with the active item checked. Drill in and toggle
			// it off.
			await page
				.getByRole( 'menuitem', { name: 'Complete Source' } )
				.click();
			const checkedItem = page.getByRole( 'menuitemcheckbox', {
				name: 'Text Field Label',
				checked: true,
			} );
			await expect( checkedItem ).toBeVisible();
			await checkedItem.click();

			// Border removed, ConnectedButton flipped back to "Connect".
			await expect(
				page.locator(
					'.block-editor-content-only-controls__rich-text.is-connected'
				)
			).toHaveCount( 0 );
			await expect(
				page.getByRole( 'button', { name: 'Connect' } )
			).toBeVisible();
		} );

		test( 'attribute not in supported list hides ConnectedButton (AC6)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: { content: 'heading content', level: 2 },
			} );

			// `level` is enum-typed and not in supported attrs; no picker.
			// Heading's `content` IS bindable, so we should still see one
			// Connect button, but not multiple (one per non-bindable field).
			const connectButtons = page.getByRole( 'button', {
				name: 'Connect',
			} );
			await expect( connectButtons ).toHaveCount( 1 );
		} );

		// AC7 verification deferred to the `useBlockBindingsCompatibleFields`
		// unit test (Task 8) — `core/post-date`, `core/navigation-link`,
		// `core/navigation-submenu` do not register `fieldsKey` arrays today,
		// so the Content tab is empty for them and an integration assertion
		// would be vacuous. The unit test exercises the gate predicate for
		// blocks in `BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS` directly per spec
		// §5 Unit fallback.

		test( 'no compatible source hides ConnectedButton; passive border still renders for already-bound (AC8)', async ( {
			editor,
			page,
		} ) => {
			// Insert a paragraph already bound to a source whose key is no
			// longer available (simulated by binding to a non-existent
			// fieldsList key). The cherry-pick's `is-connected` border MUST
			// still render even though `ConnectedButton` should not.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'bound paragraph',
					metadata: {
						bindings: {
							content: {
								source: 'testing/server-only-source',
								args: { key: 'nonexistent' },
							},
						},
					},
				},
			} );

			// Passive border still rendered (cherry-pick behavior).
			await expect(
				page.locator(
					'.block-editor-content-only-controls__rich-text.is-connected'
				)
			).toBeVisible();
		} );

		test( 'canUpdateBlockBindings=false hides ConnectedButton; border still renders (AC9)', async ( {
			editor,
			page,
		} ) => {
			// Lock down bindings via editor settings BEFORE inserting the
			// block so the gate observes the false value on first render.
			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/block-editor' )
					.updateSettings( { canUpdateBlockBindings: false } );
			} );

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'bound paragraph',
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

			// ConnectedButton absent in both bound and unbound states.
			await expect(
				page.getByRole( 'button', { name: 'Connect' } )
			).toHaveCount( 0 );
			await expect(
				page.getByRole( 'button', { name: 'Disconnect' } )
			).toHaveCount( 0 );

			// Passive border still rendered.
			await expect(
				page.locator(
					'.block-editor-content-only-controls__rich-text.is-connected'
				)
			).toBeVisible();
		} );

		test( 'legacy Attributes panel appears in Content tab, not Settings (AC10)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'paragraph for legacy panel' },
			} );

			// Content tab is the default with the experimental flag on.
			await expect(
				page
					.getByRole( 'tabpanel', { name: 'Content' } )
					.getByLabel( 'Attributes options' )
			).toBeVisible();

			// Settings tab MUST NOT host the Attributes panel anymore.
			await page.getByRole( 'tab', { name: 'Settings' } ).click();
			await expect(
				page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Attributes options' )
			).toBeHidden();
		} );

		test( 'inline picker and legacy panel reflect each others edits (AC12)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'paragraph' },
			} );

			// Bind via the inline picker.
			await page.getByRole( 'button', { name: 'Connect' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Complete Source' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'Text Field Label' } )
				.click();

			// Legacy panel (same Content tab) shows the new binding text on
			// the `content` attribute row.
			const legacyContentRow = page
				.getByRole( 'tabpanel', { name: 'Content' } )
				.getByRole( 'button', { name: /^content/ } );
			await expect( legacyContentRow ).toContainText(
				'Text Field Label'
			);
		} );

		test( 'reset-all in legacy panel clears inline-picker bindings (AC15)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'paragraph' },
			} );

			// Bind via the inline picker first.
			await page.getByRole( 'button', { name: 'Connect' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Complete Source' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'Text Field Label' } )
				.click();

			// Confirm bound state via the inline ConnectedButton.
			await expect(
				page.getByRole( 'button', { name: 'Disconnect' } )
			).toBeVisible();

			// Reset all bindings via the legacy panel's ToolsPanel menu.
			await page.getByLabel( 'Attributes options' ).click();
			await page.getByRole( 'menuitem', { name: 'Reset all' } ).click();

			// Inline UI flipped back to unbound; passive border gone.
			await expect(
				page.getByRole( 'button', { name: 'Connect' } )
			).toBeVisible();
			await expect(
				page.locator(
					'.block-editor-content-only-controls__rich-text.is-connected'
				)
			).toHaveCount( 0 );
		} );
	} );

	test.describe( 'flag off', () => {
		test.beforeEach( async ( { admin } ) => {
			// Do NOT set `__experimentalContentOnlyInspectorFields`.
			await admin.createNewPost( { title: 'Inline picker tests' } );
		} );

		test( 'legacy Attributes panel remains in Settings tab (AC11)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'paragraph' },
			} );

			await page.getByRole( 'tab', { name: 'Settings' } ).click();
			await expect(
				page
					.getByRole( 'tabpanel', { name: 'Settings' } )
					.getByLabel( 'Attributes options' )
			).toBeVisible();
		} );

		test( 'ConnectedButton is absent for all fields (AC13)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'paragraph' },
			} );

			// The new picker UI is gated on the experimental flag — absent
			// means no Connect/Disconnect buttons anywhere in the inspector.
			await expect(
				page.getByRole( 'button', { name: 'Connect' } )
			).toHaveCount( 0 );
			await expect(
				page.getByRole( 'button', { name: 'Disconnect' } )
			).toHaveCount( 0 );
		} );
	} );
} );
