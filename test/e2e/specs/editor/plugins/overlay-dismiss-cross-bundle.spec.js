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

const PLUGIN_SLUG = 'gutenberg-test-overlay-dismiss-stress-test';
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

			test( `[${ mode }] click inside Dialog (outside Select) closes Select`, async ( {
				page,
			} ) => {
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();

				await page.getByTestId( `${ prefix }-select-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeVisible();

				// Base UI marks the dialog as inert when Select opens.
				// Use force to bypass Playwright's actionability check.
				await page
					.getByTestId( `${ prefix }-dialog-popup` )
					.click( { position: { x: 10, y: 10 }, force: true } );

				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeHidden();
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] Escape with Select open closes Select`, async ( {
				page,
			} ) => {
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-select-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeVisible();

				await page.keyboard.press( 'Escape' );

				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeHidden();
				// Dialog stays open.
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] Escape with Dialog open (no Select) closes Dialog`, async ( {
				page,
			} ) => {
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-dialog-popup` )
				).toBeVisible();

				await page.keyboard.press( 'Escape' );

				await expect(
					page.getByTestId( `${ prefix }-dialog-status` )
				).toHaveAttribute( 'data-state', 'closed' );
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
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-outer-popup` )
				).toBeVisible();

				await page.getByTestId( `${ prefix }-inner-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-inner-popup` )
				).toBeVisible();

				await page.getByTestId( `${ prefix }-inner-popup` ).click();

				await expect(
					page.getByTestId( `${ prefix }-outer-popup` )
				).toBeVisible();
				await expect(
					page.getByTestId( `${ prefix }-inner-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] Escape closes only inner popover`, async ( {
				page,
			} ) => {
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await page.getByTestId( `${ prefix }-inner-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-inner-popup` )
				).toBeVisible();

				await page.keyboard.press( 'Escape' );

				await expect(
					page.getByTestId( `${ prefix }-inner-status` )
				).toHaveAttribute( 'data-state', 'closed' );
				await expect(
					page.getByTestId( `${ prefix }-outer-popup` )
				).toBeVisible();
			} );

			test( `[${ mode }] Escape twice closes both popovers`, async ( {
				page,
			} ) => {
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await page.getByTestId( `${ prefix }-inner-trigger` ).click();

				await page.keyboard.press( 'Escape' );
				await page.keyboard.press( 'Escape' );

				await expect(
					page.getByTestId( `${ prefix }-outer-status` )
				).toHaveAttribute( 'data-state', 'closed' );
				await expect(
					page.getByTestId( `${ prefix }-inner-status` )
				).toHaveAttribute( 'data-state', 'closed' );
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
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-popover-trigger` ).click();
				await page.getByTestId( `${ prefix }-select-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-select-popup` )
				).toBeVisible();

				await page.keyboard.press( 'Escape' );

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
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-popover-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-popover-popup` )
				).toBeVisible();

				await page.keyboard.press( 'Escape' );

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
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-popover-trigger` ).click();

				await page
					.getByTestId( `${ prefix }-dialog-popup` )
					.click( { position: { x: 10, y: 10 } } );

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
				await page.getByTestId( `${ prefix }-dialog-trigger` ).click();
				await page.getByTestId( `${ prefix }-popover-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-popover-popup` )
				).toBeVisible();

				await page.getByTestId( `${ prefix }-popover-popup` ).click();

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
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await page.getByTestId( `${ prefix }-inner-trigger` ).click();
				await expect(
					page.getByTestId( `${ prefix }-inner-popup` )
				).toBeVisible();

				await page.getByTestId( `${ prefix }-inner-popup` ).click();

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
				await page.getByTestId( `${ prefix }-outer-trigger` ).click();
				await page.getByTestId( `${ prefix }-inner-trigger` ).click();

				await page.keyboard.press( 'Escape' );

				await expect(
					page.getByTestId( `${ prefix }-inner-status` )
				).toHaveAttribute( 'data-state', 'closed' );
				await expect(
					page.getByTestId( `${ prefix }-outer-popup` )
				).toBeVisible();
			} );
		}
	} );
} );
