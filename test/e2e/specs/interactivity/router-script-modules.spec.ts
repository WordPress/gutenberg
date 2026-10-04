import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

type Violation = { directive: string; blockedURI: string };

/**
 * Collects the Content Security Policy violations reported by the page.
 *
 * @param page Playwright page.
 * @return List that is filled with the reported violations.
 */
async function collectViolations( page: Page ) {
	const violations: Violation[] = [];
	await page.exposeFunction( 'reportViolation', ( violation: Violation ) =>
		violations.push( violation )
	);
	await page.addInitScript( () => {
		document.addEventListener( 'securitypolicyviolation', ( event ) =>
			( window as any ).reportViolation( {
				directive: event.effectiveDirective,
				blockedURI: event.blockedURI,
			} )
		);
	} );
	return violations;
}

/**
 * Checks whether the page's Content Security Policy lets it run `eval()` and
 * compile WebAssembly.
 *
 * Playwright may exempt the code that `page.evaluate()` runs from the page's
 * policy, so the checks run in a later task.
 *
 * @param page Playwright page.
 * @return Whether `eval()` and WebAssembly compilation are allowed.
 */
const getAllowedCodeGeneration = ( page: Page ) =>
	page.evaluate( () =>
		new Promise< boolean >( ( resolve ) =>
			setTimeout( () => {
				try {
					// eslint-disable-next-line no-eval
					eval( '1' );
					resolve( true );
				} catch {
					resolve( false );
				}
			} )
		).then( async ( evalAllowed ) => ( {
			eval: evalAllowed,
			webAssembly: await WebAssembly.compile(
				// An empty WebAssembly module.
				new Uint8Array( [ 0, 97, 115, 109, 1, 0, 0, 0 ] )
			).then(
				() => true,
				() => false
			),
		} ) )
	);

test.describe( 'Router script modules', () => {
	let originalSiteTitle: string;

	test.beforeAll( async ( { requestUtils, interactivityUtils: utils } ) => {
		// The page title assertions below include the site title, which
		// wp-env derives from the checkout directory name. Pin it so the
		// tests do not depend on where the repository was cloned.
		originalSiteTitle = ( await requestUtils.getSiteSettings() ).title;
		await requestUtils.updateSiteSettings( { title: 'gutenberg' } );

		await utils.activatePlugins();
		const alpha = await utils.addPostWithBlock(
			'test/router-script-modules-wrapper',
			{
				alias: 'alpha',
				innerBlocks: [ [ 'test/router-script-modules-alpha' ] ],
			}
		);
		const bravo = await utils.addPostWithBlock(
			'test/router-script-modules-wrapper',
			{
				alias: 'bravo',
				innerBlocks: [ [ 'test/router-script-modules-bravo' ] ],
			}
		);
		const charlie = await utils.addPostWithBlock(
			'test/router-script-modules-wrapper',
			{
				alias: 'charlie',
				innerBlocks: [ [ 'test/router-script-modules-charlie' ] ],
			}
		);

		const all = await utils.addPostWithBlock(
			'test/router-script-modules-wrapper',
			{
				alias: 'all',
				innerBlocks: [
					[ 'test/router-script-modules-alpha' ],
					[ 'test/router-script-modules-bravo' ],
					[ 'test/router-script-modules-charlie' ],
				],
			}
		);

		await utils.addPostWithBlock( 'test/router-script-modules-wrapper', {
			alias: 'none',
			attributes: { links: { alpha, bravo, charlie, all } },
		} );
	} );

	test.beforeEach( async ( { page, interactivityUtils: utils } ) => {
		await page.goto( utils.getLink( 'none' ) );
	} );

	test.afterAll( async ( { requestUtils, interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
		await requestUtils.updateSiteSettings( { title: originalSiteTitle } );
	} );

	for ( const [ testId, buttonId, expectedValues ] of [
		[
			'static modules from new blocks',
			'static',
			{ alpha: 'alpha-1', bravo: 'bravo-1', charlie: 'charlie-1' },
		],
		[
			'dynamic modules from new blocks',
			'dynamic',
			{ alpha: 'alpha-2', bravo: 'bravo-2', charlie: 'charlie-2' },
		],
		[
			'static modules from initial page',
			'initial-static',
			{ alpha: 'initial-1', bravo: 'initial-1', charlie: 'initial-1' },
		],
		[
			'dynamic modules from initial page',
			'initial-dynamic',
			{ alpha: 'initial-2', bravo: 'initial-2', charlie: 'initial-2' },
		],
	] as const ) {
		test( `should handle ${ testId }`, async ( { page } ) => {
			const requestedModules = [];

			await page.route( '**/*.js*', async ( route ) => {
				requestedModules.push( route.request().url() );
				await route.continue();
			} );

			const csn = page.getByTestId( 'client-side navigation' );
			const alpha = page.getByTestId( 'alpha-block' );
			const bravo = page.getByTestId( 'bravo-block' );
			const charlie = page.getByTestId( 'charlie-block' );

			await page.getByTestId( 'link alpha' ).click();

			// This element disappears when a navigation starts.
			await expect( csn ).toBeHidden();

			// Check the page title to ensure navigation was successful.
			await expect( page ).toHaveTitle( 'alpha – gutenberg' );

			// This should be visible again after a successful client-side
			// navigation.
			await expect( csn ).toBeVisible();

			await expect( alpha ).toBeVisible();
			await expect( bravo ).toBeHidden();
			await expect( charlie ).toBeHidden();
			await expect( alpha.getByTestId( 'text' ) ).toHaveText( 'alpha' );

			// This click executes an action that does a dynamic import and
			// modifies the block text.
			await alpha.getByTestId( buttonId ).click();
			await expect( alpha.getByTestId( 'text' ) ).toHaveText(
				expectedValues.alpha
			);

			await page.getByTestId( 'link bravo' ).click();

			await expect( csn ).toBeHidden();
			await expect( page ).toHaveTitle( 'bravo – gutenberg' );
			await expect( csn ).toBeVisible();

			await expect( alpha ).toBeHidden();
			await expect( bravo ).toBeVisible();
			await expect( charlie ).toBeHidden();

			await bravo.getByTestId( buttonId ).click();
			await expect( bravo.getByTestId( 'text' ) ).toHaveText(
				expectedValues.bravo
			);

			await page.getByTestId( 'link charlie' ).click();

			await expect( csn ).toBeHidden();
			await expect( page ).toHaveTitle( 'charlie – gutenberg' );
			await expect( csn ).toBeVisible();

			await expect( alpha ).toBeHidden();
			await expect( bravo ).toBeHidden();
			await expect( charlie ).toBeVisible();

			await charlie.getByTestId( buttonId ).click();
			await expect( charlie.getByTestId( 'text' ) ).toHaveText(
				expectedValues.charlie
			);

			await page.getByTestId( 'link all' ).click();

			await expect( csn ).toBeHidden();
			await expect( page ).toHaveTitle( 'all – gutenberg' );
			await expect( csn ).toBeVisible();

			await expect( alpha ).toBeVisible();
			await expect( bravo ).toBeVisible();
			await expect( charlie ).toBeVisible();

			await expect( alpha.getByTestId( 'text' ) ).toHaveText(
				expectedValues.alpha
			);
			await expect( bravo.getByTestId( 'text' ) ).toHaveText(
				expectedValues.bravo
			);
			await expect( charlie.getByTestId( 'text' ) ).toHaveText(
				expectedValues.charlie
			);
		} );
	}

	test.describe( 'with a Content Security Policy (@firefox, @webkit)', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-content-security-policy'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-content-security-policy'
			);
		} );

		// The test plugin sends these policies when the `csp` query parameter
		// names them. Neither allows `'unsafe-eval'` or `'wasm-unsafe-eval'`.
		for ( const policy of [ 'nonce', 'allowlist' ] ) {
			test( `should load new script modules with the ${ policy } policy`, async ( {
				page,
				interactivityUtils: utils,
			} ) => {
				const url = new URL( utils.getLink( 'none' ) );
				url.searchParams.set( 'csp', policy );

				// Check the policy on another page, so the violations that the
				// checks cause don't mix with the ones collected below.
				const policyPage = await page.context().newPage();
				await policyPage.goto( url.href );
				expect( await getAllowedCodeGeneration( policyPage ) ).toEqual(
					{
						eval: false,
						webAssembly: false,
					}
				);
				await policyPage.close();

				const violations = await collectViolations( page );
				await page.goto( url.href );

				const csn = page.getByTestId( 'client-side navigation' );

				// None of these blocks, nor the modules they import, are on the
				// initial page.
				for ( const block of [ 'alpha', 'bravo', 'charlie' ] ) {
					await page.getByTestId( `link ${ block }` ).click();

					await expect( csn ).toBeHidden();
					await expect( page ).toHaveTitle(
						`${ block } – gutenberg`
					);
					// Only visible again after a client-side navigation.
					await expect( csn ).toBeVisible();

					const element = page.getByTestId( `${ block }-block` );
					const text = element.getByTestId( 'text' );
					await expect( text ).toHaveText( block );

					// Each button runs an action that uses a module imported
					// statically or dynamically.
					for ( const [ button, value ] of [
						[ 'static', `${ block }-1` ],
						[ 'dynamic', `${ block }-2` ],
						[ 'initial-static', 'initial-1' ],
						[ 'initial-dynamic', 'initial-2' ],
					] ) {
						await element.getByTestId( button ).click();
						await expect( text ).toHaveText( value );
					}
				}

				// The router didn't need `eval()` or WebAssembly, and the policy
				// allowed the modules it imported from Blob URLs. Other Blob
				// URLs, like the one of the worker that the emoji script of
				// WordPress starts, are reported for other directives.
				expect(
					violations.filter(
						( { directive, blockedURI } ) =>
							[ 'eval', 'wasm-eval' ].includes( blockedURI ) ||
							( directive.startsWith( 'script-src' ) &&
								blockedURI.startsWith( 'blob' ) )
					)
				).toEqual( [] );
			} );
		}
	} );
} );
