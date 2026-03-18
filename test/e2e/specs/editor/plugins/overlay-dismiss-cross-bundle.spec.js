/**
 * Tests for cross-bundle overlay dismiss coordination.
 *
 * Each scenario is tested in two modes:
 *   - same-bundle:  all components from the same @base-ui/react bundle (baseline)
 *   - cross-bundle: components from two independent bundles (the real-world case)
 *
 * Tests that pass in both modes confirm correct behavior. Tests that pass in
 * same-bundle but fail in cross-bundle document known regressions caused by
 * React context isolation.
 *
 * Prerequisites: the overlay stress test plugin must be active and its bundles
 * must be pre-built with:
 *   node packages/e2e-tests/plugins/overlay-dismiss-stress-test/build-bundles.mjs
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const PLUGIN_SLUG = 'overlay-dismiss-stress-test';
const ADMIN_PAGE = 'tools.php';
const PAGE_QUERY = 'page=overlay-dismiss-stress-test';

const MODES = [ 'same-bundle', 'cross-bundle' ];

test.describe( 'Cross-bundle overlay dismiss coordination', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( PLUGIN_SLUG );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PLUGIN_SLUG );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitAdminPage( ADMIN_PAGE, PAGE_QUERY );
	} );

	// ─── 1.1 Dialog + Select ───────────────────────────────────────────

	test.describe( '1.1 Dialog + Select', () => {
		for ( const mode of MODES ) {
			const prefix = `1.1-${ mode }`;

			test( `[${ mode }] click outside Select closes Select but not Dialog`, async ( {
				page,
			} ) => {
				// Open Dialog.
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();

				// Open Select.
				await page.getByTestId( `${ prefix }-select-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeVisible();

				// Click inside Dialog but outside Select.
				await page
					.getByTestId( `${ prefix }-dialog-popup` )
					.click( { position: { x: 10, y: 10 } } );

				// Select should close, Dialog should stay open.
				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeHidden();
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] click outside Dialog closes Dialog`, async ( {
				page,
			} ) => {
				// Open Dialog.
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();

				// Click outside (on the backdrop area).
				await page.mouse.click( 5, 5 );

				// Dialog should close.
				await expect(
					page.getByTestId( `${ prefix }-dialog-status` )
				).toHaveAttribute( 'data-state', 'closed' );
			} );

			test( `[${ mode }] Escape with Select open closes Select`, async ( {
				page,
			} ) => {
				// Open Dialog, then Select.
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-select-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeVisible();

				// Press Escape.
				await page.keyboard.press( 'Escape' );

				// Select should close.
				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeHidden();
			} );
		}
	} );

	// ─── 1.2 Popover in Popover ────────────────────────────────────────

	test.describe( '1.2 Popover in Popover', () => {
		for ( const mode of MODES ) {
			const prefix = `1.2-${ mode }`;

			test( `[${ mode }] click inside inner popup — outer stays open`, async ( {
				page,
			} ) => {
				// Open outer, then inner.
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-outer-popup` )
				).toBeVisible();

				await page.getByTestId( `${ prefix }-inner-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-inner-popup` )
				).toBeVisible();

				// Click inside inner popup.
				await page.getByTestId( `${ prefix }-inner-popup` ).click();

				// Both should stay open.
				await expect(
					page.getByTestId( `${ prefix }-outer-popup` )
				).toBeVisible();
				await expect(
					page.getByTestId( `${ prefix }-inner-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] click outside both closes both`, async ( {
				page,
			} ) => {
				// Open outer, then inner.
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await page.getByTestId( `${ prefix }-inner-trigger` ).click();

				// Click empty area.
				await page.mouse.click( 5, 5 );

				// Both should close.
				await expect(
					page.getByTestId( `${ prefix }-outer-status` )
				).toHaveAttribute( 'data-state', 'closed' );
				await expect(
					page.getByTestId( `${ prefix }-inner-status` )
				).toHaveAttribute( 'data-state', 'closed' );
			} );

			test( `[${ mode }] Escape closes only inner popover`, async ( {
				page,
			} ) => {
				// Open outer, then inner.
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await page.getByTestId( `${ prefix }-inner-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-inner-popup` )
				).toBeVisible();

				// Press Escape.
				await page.keyboard.press( 'Escape' );

				// Inner should close, outer should stay open.
				await expect(
					page.getByTestId( `${ prefix }-inner-status` )
				).toHaveAttribute( 'data-state', 'closed' );
				await expect(
					page.getByTestId( `${ prefix }-outer-popup` )
				).toBeVisible();
			} );
		}
	} );

	// ─── 1.3 Three-level nesting ───────────────────────────────────────

	test.describe( '1.3 Three-level nesting (Dialog + Popover + Select)', () => {
		for ( const mode of MODES ) {
			const prefix = `1.3-${ mode }`;

			test( `[${ mode }] Escape with Select open closes only Select`, async ( {
				page,
			} ) => {
				// Open Dialog → Popover → Select.
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-popover-trigger` ).click();
				await page.getByTestId( `${ prefix }-select-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeVisible();

				// Press Escape.
				await page.keyboard.press( 'Escape' );

				// Select should close; Popover and Dialog stay open.
				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeHidden();
				await expect(
					page.getByTestId( `${ prefix }-popover-popup` )
				).toBeVisible();
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] Escape with Popover open closes only Popover`, async ( {
				page,
			} ) => {
				// Open Dialog → Popover (no Select).
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-popover-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-popover-popup` )
				).toBeVisible();

				// Press Escape.
				await page.keyboard.press( 'Escape' );

				// Popover should close; Dialog stays open.
				await expect(
					page.getByTestId( `${ prefix }-popover-status` )
				).toHaveAttribute( 'data-state', 'closed' );
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] click on Dialog body closes Popover but not Dialog`, async ( {
				page,
			} ) => {
				// Open Dialog → Popover.
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-popover-trigger` ).click();

				// Click inside Dialog but outside Popover.
				await page
					.getByTestId( `${ prefix }-dialog-popup` )
					.click( { position: { x: 10, y: 10 } } );

				// Popover closes, Dialog stays.
				await expect(
					page.getByTestId( `${ prefix }-popover-status` )
				).toHaveAttribute( 'data-state', 'closed' );
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();
			} );
		}
	} );

	// ─── 1.4 Modal Dialog + Popover ────────────────────────────────────

	test.describe( '1.4 Modal Dialog + Popover', () => {
		for ( const mode of MODES ) {
			const prefix = `1.4-${ mode }`;

			test( `[${ mode }] click Popover popup — Dialog stays open`, async ( {
				page,
			} ) => {
				// Open Dialog, then Popover.
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-popover-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-popover-popup` )
				).toBeVisible();

				// Click inside Popover.
				await page.getByTestId( `${ prefix }-popover-popup` ).click();

				// Dialog should stay open.
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] Escape with Popover open closes Popover`, async ( {
				page,
			} ) => {
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-popover-trigger` ).click();

				await page.keyboard.press( 'Escape' );

				await expect(
					page.getByTestId( `${ prefix }-popover-status` )
				).toHaveAttribute( 'data-state', 'closed' );
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();
			} );
		}
	} );

	// ─── 1.5 Dialog in Dialog ──────────────────────────────────────────

	test.describe( '1.5 Dialog in Dialog', () => {
		for ( const mode of MODES ) {
			const prefix = `1.5-${ mode }`;

			test( `[${ mode }] click inside inner Dialog — outer stays open`, async ( {
				page,
			} ) => {
				// Open outer, then inner.
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await page.getByTestId( `${ prefix }-inner-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-inner-popup` )
				).toBeVisible();

				// Click inside inner.
				await page.getByTestId( `${ prefix }-inner-popup` ).click();

				// Both stay open.
				await expect(
					page.getByTestId( `${ prefix }-outer-popup` )
				).toBeVisible();
				await expect(
					page.getByTestId( `${ prefix }-inner-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] Escape with inner Dialog open — only inner closes`, async ( {
				page,
			} ) => {
				// Open outer, then inner.
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await page.getByTestId( `${ prefix }-inner-trigger` ).click();

				await page.keyboard.press( 'Escape' );

				// Inner should close.
				await expect(
					page.getByTestId( `${ prefix }-inner-status` )
				).toHaveAttribute( 'data-state', 'closed' );

				if ( mode === 'same-bundle' ) {
					// Same bundle: outer stays open (Dialog nesting counter works).
					await expect(
						page.getByTestId( `${ prefix }-outer-popup` )
					).toBeVisible();
				}
				// Cross-bundle: outer may also close (known regression —
				// DialogRootContext counter is not shared). We don't assert
				// the outer state here for cross-bundle because the behavior
				// is a documented regression, not a test failure.
			} );
		}

		test( 'cross-bundle regression: Escape closes BOTH dialogs', async ( {
			page,
		} ) => {
			const prefix = '1.5-cross-bundle';

			// Open outer, then inner.
			await page.getByTestId( `${ prefix }-outer-trigger` ).click();
			await page.getByTestId( `${ prefix }-inner-trigger` ).click();

			await page.keyboard.press( 'Escape' );

			// Known regression: both close because DialogRootContext is not
			// shared across bundles. The parent doesn't know a child is open.
			await expect(
				page.getByTestId( `${ prefix }-inner-status` )
			).toHaveAttribute( 'data-state', 'closed' );
			await expect(
				page.getByTestId( `${ prefix }-outer-status` )
			).toHaveAttribute( 'data-state', 'closed' );
		} );

		test( 'same-bundle baseline: Escape closes only inner Dialog', async ( {
			page,
		} ) => {
			const prefix = '1.5-same-bundle';

			await page.getByTestId( `${ prefix }-outer-trigger` ).click();
			await page.getByTestId( `${ prefix }-inner-trigger` ).click();

			await page.keyboard.press( 'Escape' );

			// Same bundle: only inner closes.
			await expect(
				page.getByTestId( `${ prefix }-inner-status` )
			).toHaveAttribute( 'data-state', 'closed' );
			await expect(
				page.getByTestId( `${ prefix }-outer-popup` )
			).toBeVisible();
		} );
	} );
} );
