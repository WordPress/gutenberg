/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const CSP_NONCE = 'test-csp-nonce-123';

type CspRouteOptions = {
	/**
	 * `Content-Security-Policy` header value, or `null` to send none.
	 */
	csp: string | null;
	/**
	 * When set, `data-nonce="{nonce}"` is injected onto `<html>` so csp.ts
	 * switches to the nonced-script compilation path.
	 */
	nonce: string | null;
	/**
	 * When set, every `<script>` tag in the document is given
	 * `nonce="{scriptNonce}"` so it satisfies `script-src 'nonce-...'`. This
	 * mirrors what the server/mu-plugin must do for WP-managed and inline
	 * scripts; without it those scripts are blocked by the policy. Defaults
	 * to `nonce` when omitted.
	 */
	scriptNonce?: string | null;
};

/**
 * Intercepts the document response and rewrites it to simulate a server that
 * enforces a given CSP. This is the only mechanism the iAPI JS needs to be
 * exercised in a real browser — no PHP/mu-plugin required. Returns the array
 * of CSP-related console / page errors collected during the page's life.
 */
async function setupCspRoute(
	page: Page,
	{ csp, nonce, scriptNonce }: CspRouteOptions
): Promise< string[] > {
	const cspErrors: string[] = [];
	page.on( 'console', ( msg ) => {
		const text = msg.text();
		if (
			text.includes( 'Content Security Policy' ) ||
			text.includes( 'unsafe-eval' ) ||
			text.includes( 'CSP' ) ||
			text.includes( 'violates' )
		) {
			cspErrors.push( text );
		}
	} );
	page.on( 'pageerror', ( err ) => cspErrors.push( 'pageerror: ' + err.message ) );

	await page.route( '**/*', async ( route ) => {
		const request = route.request();
		if ( request.resourceType() !== 'document' ) {
			return route.continue();
		}
		const response = await route.fetch();
		let body = await response.text();
		const headers: Record< string, string > = { ...response.headers() };

		if ( nonce ) {
			body = body.replace(
				/<html(\s|>)/i,
				`<html data-nonce="${ nonce }"$1`
			);
		}
		// scriptNonce defaults to `nonce` only when omitted (undefined). An
		// explicit `null` means "do not nonce any scripts" — used by the
		// strict-dynamic test where we WANT the iAPI module blocked.
		const effectiveScriptNonce =
			scriptNonce !== undefined ? scriptNonce : nonce;
		if ( effectiveScriptNonce ) {
			body = body.replace(
				/<script(\s|>)/gi,
				`<script nonce="${ effectiveScriptNonce }"$1`
			);
		}
		if ( csp ) {
			headers[ 'content-security-policy' ] = csp;
		} else {
			delete headers[ 'content-security-policy' ];
		}

		await route.fulfill( { status: response.status(), headers, body } );
	} );

	return cspErrors;
}

/**
 * Filters the raw CSP error list down to violations caused by the iAPI's own
 * expression compilation. WordPress core ships inline scripts (emoji, admin
 * bar) and a blob: worker that violate a strict policy regardless of the iAPI,
 * so we must not fail the test on those. The iAPI-specific signal is a
 * violation that mentions `unsafe-eval` (the Function() path) or a blocked
 * inline script that is NOT one of core's known hashes.
 */
function iapiCspViolations( errors: string[] ): string[] {
	const coreHashes = [
		'sha256-Ghi0bGePOhuA1j+MGwQlfJRRMPWPDDQVJ6To/79pv94=',
		'sha256-kV5m/mD8ITMUrWZTkrkVXWuvF/Zoet+XBU5RFcPQk0A=',
	];
	return errors.filter( ( e ) => {
		if ( e.includes( 'blob:' ) ) {
			return false;
		}
		if ( coreHashes.some( ( h ) => e.includes( h ) ) ) {
			return false;
		}
		return true;
	} );
}

/**
 * The shared interaction: initial text is 'no' (count 0), clicking the store
 * action increments state to 1 (text 'yes'), and the inline expression
 * increments state to 2.
 */
async function assertInlineExpressionsWork(
	page: Page,
	link: string
): Promise< void > {
	await page.goto( link );
	await expect( page.getByTestId( 'csp text' ) ).toHaveText( 'no' );
	await expect( page.getByTestId( 'csp count' ) ).toHaveText( '0' );
	await page.getByTestId( 'csp inc' ).click();
	await expect( page.getByTestId( 'csp text' ) ).toHaveText( 'yes' );
	await expect( page.getByTestId( 'csp count' ) ).toHaveText( '1' );
	await page.getByTestId( 'csp inline inc' ).click();
	await expect( page.getByTestId( 'csp count' ) ).toHaveText( '2' );
}

test.describe( 'CSP nonce - inline expressions without unsafe-eval', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/csp-nonce' );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'no CSP: inline expressions work via Function() fallback', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const cspErrors = await setupCspRoute( page, {
			csp: null,
			nonce: null,
		} );
		await assertInlineExpressionsWork( page, utils.getLink( 'test/csp-nonce' ) );
		expect( iapiCspViolations( cspErrors ) ).toEqual( [] );
		await page.unroute( '**/*' );
	} );

	test( "script-src 'self' 'unsafe-eval': Function() fallback still works", async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const cspErrors = await setupCspRoute( page, {
			csp: `script-src 'self' 'unsafe-eval' 'unsafe-inline'`,
			nonce: null,
		} );
		await assertInlineExpressionsWork( page, utils.getLink( 'test/csp-nonce' ) );
		expect( iapiCspViolations( cspErrors ) ).toEqual( [] );
		await page.unroute( '**/*' );
	} );

	test( "script-src 'self' 'nonce-...': nonced compilation, no unsafe-eval", async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const cspErrors = await setupCspRoute( page, {
			csp: `script-src 'self' 'nonce-${ CSP_NONCE }'`,
			nonce: CSP_NONCE,
		} );

		await page.goto( utils.getLink( 'test/csp-nonce' ) );

		// data-nonce must be consumed and removed by csp.ts.
		await expect
			.poll( async () =>
				page.evaluate( () =>
					document.documentElement.hasAttribute( 'data-nonce' )
				)
			)
			.toBe( false );

		await expect( page.getByTestId( 'csp text' ) ).toHaveText( 'no' );
		await expect( page.getByTestId( 'csp count' ) ).toHaveText( '0' );
		await page.getByTestId( 'csp inc' ).click();
		await expect( page.getByTestId( 'csp text' ) ).toHaveText( 'yes' );
		await expect( page.getByTestId( 'csp count' ) ).toHaveText( '1' );
		await page.getByTestId( 'csp inline inc' ).click();
		await expect( page.getByTestId( 'csp count' ) ).toHaveText( '2' );

		// No iAPI-specific CSP violations — every iAPI script was nonced.
		expect( iapiCspViolations( cspErrors ) ).toEqual( [] );
		await page.unroute( '**/*' );
	} );

	test( "script-src 'self' (no nonce, no unsafe-eval): expressions are blocked", async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const cspErrors = await setupCspRoute( page, {
			csp: `script-src 'self' 'unsafe-inline'`,
			nonce: null,
		} );

		await page.goto( utils.getLink( 'test/csp-nonce' ) );

		// The iAPI module loads ('self'), but Function() is blocked, so
		// expressions never evaluate. The text stays empty, not 'no'.
		await expect( page.getByTestId( 'csp text' ) ).not.toHaveText( 'no' );
		await page.getByTestId( 'csp inc' ).click();
		await expect( page.getByTestId( 'csp text' ) ).not.toHaveText( 'yes' );

		// CSP must have blocked the eval.
		expect( cspErrors.length ).toBeGreaterThan( 0 );
		await page.unroute( '**/*' );
	} );

	test( "script-src 'nonce-...' 'strict-dynamic' alone: external scripts blocked", async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const cspErrors = await setupCspRoute( page, {
			csp: `script-src 'nonce-${ CSP_NONCE }' 'strict-dynamic'`,
			nonce: CSP_NONCE,
			scriptNonce: null,
		} );

		await page.goto( utils.getLink( 'test/csp-nonce' ) );

		// The iAPI module (an external script) is blocked because it is not
		// nonced and 'strict-dynamic' does not help top-level scripts. So
		// csp.ts never runs and data-nonce is never consumed.
		await expect
			.poll( async () =>
				page.evaluate( () =>
					document.documentElement.hasAttribute( 'data-nonce' )
				)
			)
			.toBe( true );

		await expect( page.getByTestId( 'csp text' ) ).not.toHaveText( 'no' );
		expect( cspErrors.length ).toBeGreaterThan( 0 );
		await page.unroute( '**/*' );
	} );
} );
