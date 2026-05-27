/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Inline Block Bindings picker — Block Fields integration.
 *
 * Covers AC1-AC15 from spec.md §4 with the following allocations:
 * - AC1 (RichText half): integration test below ("renders is-connected
 *   border on bound RichText fields"). The Text DataForm `is-connected`
 *   half of AC1 is verified via manual checklist in spec §5 alongside
 *   the Media border (the cherry-pick already ships both; no production
 *   change in this pipeline alters either DOM path).
 * - AC2-AC5, AC9-AC13, AC15: integration tests below.
 * - AC6 (req 11a "attribute not in supported list"): unit test #4 in
 *   `use-block-bindings-compatible-fields.js`
 *   (`returns isBindable=false when attribute is not in
 *   __experimentalBlockBindingsSupportedAttributes`). The e2e is
 *   `test.skip`ped — see comment on the skipped test for the
 *   no-naturally-occurring-block rationale.
 * - AC7 (req 11b/17 exclusion list): unit test #5
 *   (`returns isBindable=false for blocks in
 *   BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS`). Same `test.skip` rationale.
 * - AC8 (req 11c "no compatible source for any source"): spec §5
 *   manual verification checklist. No real registered source + real
 *   block combination naturally yields zero compatible fields without
 *   also tripping a different gate (11a or 11d), and adding a dedicated
 *   typed source to the e2e plugin fixture is outside the iteration-2
 *   fix scope.
 * - AC14 (backport changelog): file presence, not an e2e.
 *
 * The new picker is gated behind
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

		test( 'renders is-connected border on bound RichText fields (AC1 — RichText half)', async ( {
			editor,
			page,
		} ) => {
			// Scope: only the RichText `is-connected` border. The Text
			// DataForm `is-connected` half and the Media `is-connected`
			// half of AC1 are both ship-from-cherry-pick paths that no
			// production code in this pipeline touches; they are verified
			// per the spec §5 manual checklist instead of an e2e here.
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

		// AC6 verification deferred to the `useBlockBindingsCompatibleFields`
		// unit test #4 (`returns isBindable=false when attribute is not in
		// __experimentalBlockBindingsSupportedAttributes`). Iteration-1 e2e
		// inserted `core/heading` to test this gate, but Heading's only
		// registered Block Field is `content` — which IS in the supported
		// attribute list — so the assertion "exactly one Connect button"
		// passed trivially without ever triggering gate 11a. No real block
		// in trunk registers a Block Field whose `id` is absent from
		// `__experimentalBlockBindingsSupportedAttributes[blockName]` AND
		// whose type is one a registered source actually fulfills (so
		// isolating gate 11a from gates 11c/11d at the e2e level would
		// require a dedicated test block / source pair — added value over
		// the unit test is nil per spec §5 Unit fallback).
		// eslint-disable-next-line playwright/no-skipped-test, playwright/expect-expect
		test.skip( 'attribute not in supported list hides ConnectedButton (AC6) — covered by unit test #4', () => {} );

		// AC7 verification deferred to the `useBlockBindingsCompatibleFields`
		// unit test #5 — `core/post-date`, `core/navigation-link`,
		// `core/navigation-submenu` do not register `fieldsKey` arrays today,
		// so the Content tab is empty for them and an integration assertion
		// would be vacuous. The unit test exercises the gate predicate for
		// blocks in `BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS` directly per spec
		// §5 Unit fallback.
		// eslint-disable-next-line playwright/no-skipped-test, playwright/expect-expect
		test.skip( 'block in BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS hides ConnectedButton (AC7) — covered by unit test #5', () => {} );

		// AC8 verification deferred to spec §5 Manual checklist
		// ("Toggling `window.__experimentalContentOnlyInspectorFields`
		// between true/false ..." plus the inspect-without-console-errors
		// rows for blocks bound to sources without compatible fields).
		// Iteration-1 e2e inserted a paragraph bound to
		// `testing/server-only-source` (no client `getFieldsList`) and
		// asserted only the passive border, never the picker absence. Worse,
		// `testing/complete-source` (also registered by the test plugin)
		// exposes string-typed fields compatible with paragraph `content`
		// (rich-text → string), so gate 11c never actually triggered. No
		// realistic combination of the registered test sources + blocks
		// yields zero compatible fields for a Block-Fields-bearing
		// attribute without also tripping a different gate (11a/11d).
		// Adding a dedicated test source whose `getFieldsList` returns
		// only types no Block Field exposes would require touching the
		// `gutenberg-test-block-bindings` plugin fixture, which is
		// outside the iteration-2 fix scope (test file only).
		// eslint-disable-next-line playwright/no-skipped-test, playwright/expect-expect
		test.skip( 'no compatible source hides ConnectedButton (AC8) — covered by spec §5 manual checklist', () => {} );

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
