import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';

/**
 * Marks the editor canvas iframe with an attribute, then reports whether that
 * same DOM element is still on the page. A remounted canvas is a new element
 * and so has lost the mark.
 *
 * @param page
 */
async function markCanvas( page: Page ) {
	await page
		.locator( 'iframe[name="editor-canvas"]' )
		.evaluate( ( element ) => {
			element.setAttribute( 'data-remount-probe', 'same-element' );
		} );
}

function getCanvasState( page: Page ) {
	return page.evaluate( () => {
		const elements = document.querySelectorAll(
			'iframe[name="editor-canvas"]'
		);
		if ( elements.length !== 1 ) {
			return `${ elements.length } canvases`;
		}
		return (
			elements[ 0 ].getAttribute( 'data-remount-probe' ) ?? 'remounted'
		);
	} );
}

test.describe( 'Site editor canvas', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'stays mounted when the viewport crosses the mobile breakpoint', async ( {
		admin,
		page,
	} ) => {
		await page.setViewportSize( { width: 1280, height: 800 } );
		// The extensible site editor has no "edit whatever the home route
		// resolves to" route, so name the template explicitly.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await expect(
			page.locator( 'iframe[name="editor-canvas"]' )
		).toBeVisible();
		await markCanvas( page );

		// Control: a resize that stays above the breakpoint must not remount.
		await page.setViewportSize( { width: 1000, height: 800 } );
		await expect
			.poll( () => getCanvasState( page ) )
			.toBe( 'same-element' );

		// Cross below the `medium` (782px) breakpoint and back.
		await page.setViewportSize( { width: 600, height: 800 } );
		await expect
			.poll( () => getCanvasState( page ) )
			.toBe( 'same-element' );

		await page.setViewportSize( { width: 1280, height: 800 } );
		await expect
			.poll( () => getCanvasState( page ) )
			.toBe( 'same-element' );
	} );
} );
