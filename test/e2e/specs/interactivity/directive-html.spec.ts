import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/** A Trusted Types violation captured from the browser document. */
type BrowserViolation = {
	/** The CSP directive that rejected the operation. */
	directive: string;
	/** The browser-provided sample of the rejected value. */
	sample: string;
};

/**
 * Loads the directive fixture under Trusted Types enforcement.
 *
 * @param page       The page that will load the enforcing fixture.
 * @param link       The fixture URL before its enforcement query parameter.
 * @param policyMode Optional default policy to install before scripts.
 * @return           Page errors observed during this fixture load and its interactions.
 */
async function openEnforcingPage(
	page: Page,
	link: string,
	policyMode?: 'transform'
): Promise< Error[] > {
	const pageErrors: Error[] = [];
	page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
	await page.addInitScript( ( mode ) => {
		const trackedWindow = window as typeof window & {
			htmlViolations: BrowserViolation[];
		};
		trackedWindow.htmlViolations = [];
		document.addEventListener( 'securitypolicyviolation', ( event ) => {
			trackedWindow.htmlViolations.push( {
				directive: event.violatedDirective,
				sample: event.sample,
			} );
		} );
		if ( mode === 'transform' ) {
			( window as any ).trustedTypes.createPolicy( 'default', {
				createHTML: ( html: string ) =>
					html.replace( /<p/g, '<em' ).replace( /<\/p>/g, '</em>' ),
			} );
		}
	}, policyMode ?? null );
	const url = new URL( link );
	url.searchParams.set( 'require_trusted_types', 'true' );
	const response = await page.goto( url.href );
	expect( response?.headers()[ 'content-security-policy' ] ).toBe(
		"require-trusted-types-for 'script'"
	);
	await expect( page.getByTestId( 'hydration' ) ).toHaveText( 'hydrated' );
	return pageErrors;
}

/**
 * Waits for queued CSP events and returns the page's captured violations.
 *
 * @param page Page whose document recorded violations.
 * @return Trusted Types violations observed so far.
 */
async function readViolations( page: Page ): Promise< BrowserViolation[] > {
	await page.evaluate(
		() =>
			new Promise< void >( ( resolve ) =>
				requestAnimationFrame( () =>
					requestAnimationFrame( () => resolve() )
				)
			)
	);
	return page.evaluate(
		() =>
			(
				window as typeof window & {
					htmlViolations: BrowserViolation[];
				}
			 ).htmlViolations
	);
}

test.describe( 'data-wp-html', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-html' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-html' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'renders trusted HTML from asDangerousHTML()', async ( { page } ) => {
		const el = page.getByTestId( 'show state html' );
		await page.getByTestId( 'set html' ).click();
		await expect( el.getByTestId( 'rendered-strong' ) ).toHaveText(
			'Rendered HTML'
		);
	} );

	test( 'keeps the server-rendered content for the server representation until a token replaces it', async ( {
		page,
	} ) => {
		await expect( page.getByTestId( 'hydration' ) ).toHaveText(
			'hydrated'
		);
		const el = page.getByTestId( 'server html' );
		expect( await el.innerHTML() ).toBe( '<p>Server-rendered HTML</p>' );
		await page.getByTestId( 'set server html' ).click();
		await expect.poll( () => el.innerHTML() ).toBe( '<p>Client HTML</p>' );
	} );

	test( 'removes content safely and renders late trusted HTML under Trusted Types enforcement', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const pageErrors: Error[] = [];
		page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
		await page.addInitScript( () => {
			const violations: { directive: string; sample: string }[] = [];
			Object.assign( window, { htmlViolations: violations } );
			document.addEventListener( 'securitypolicyviolation', ( event ) => {
				violations.push( {
					directive: event.violatedDirective,
					sample: event.sample,
				} );
			} );
		} );
		const url = new URL( utils.getLink( 'test/directive-html' ) );
		url.searchParams.set( 'require_trusted_types', 'true' );
		const response = await page.goto( url.href );
		expect( response!.headers()[ 'content-security-policy' ] ).toBe(
			"require-trusted-types-for 'script'"
		);
		await expect( page.getByTestId( 'hydration' ) ).toHaveText(
			'hydrated'
		);
		const target = page.getByTestId( 'show state html' );
		const rejected = page.getByTestId( 'rejected html' );
		await expect.poll( () => target.innerHTML() ).toBe( '' );
		await expect(
			page.getByTestId( 'created items' ).locator( 'li' )
		).toHaveCount( 2 );
		for ( const item of await page
			.getByTestId( 'created items' )
			.locator( 'li div' )
			.all() ) {
			expect( await item.innerHTML() ).toBe( '' );
		}
		expect( await page.getByTestId( 'server html' ).innerHTML() ).toBe(
			'<p>Server-rendered HTML</p>'
		);
		// Flush queued CSP events after each observed commit, including hydration.
		const violations = async () =>
			page.evaluate( async () => {
				await new Promise< void >( ( resolve ) =>
					requestAnimationFrame( () =>
						requestAnimationFrame( () => resolve() )
					)
				);
				return (
					window as typeof window & {
						htmlViolations: { directive: string; sample: string }[];
					}
				 ).htmlViolations;
			} );
		expect( await violations() ).toEqual( [] );
		expect(
			await page.evaluate(
				() =>
					(
						window as typeof window & {
							trustedTypes: { defaultPolicy: unknown };
						}
					 ).trustedTypes.defaultPolicy
			)
		).toBeNull();
		expect( pageErrors ).toEqual( [] );
		await page.getByTestId( 'set trusted html' ).click();
		await expect.poll( () => target.innerHTML() ).toBe( '<p>Late</p>' );
		expect( await violations() ).toEqual( [] );
		expect( pageErrors ).toEqual( [] );
		await page.getByTestId( 'set loading' ).click();
		await expect.poll( () => target.innerHTML() ).toBe( '' );
		expect( await violations() ).toEqual( [] );
		expect( pageErrors ).toEqual( [] );
		expect( await rejected.innerHTML() ).toBe( '<p>Rejected fallback</p>' );
		await page.getByTestId( 'set rejected html' ).click();
		await expect.poll( violations ).toEqual( [
			{
				directive: 'require-trusted-types-for',
				sample: expect.stringContaining( '<b>x</b>' ),
			},
		] );
		expect( await rejected.innerHTML() ).toBe( '' );
		expect( await violations() ).toHaveLength( 1 );
		expect( pageErrors ).toEqual( [] );
	} );

	test( 'should ignore suffixes and unique-ids in the html directive', async ( {
		page,
	} ) => {
		await page.getByTestId( 'set html' ).click();
		await expect(
			page
				.getByTestId( 'ignores suffixes' )
				.getByTestId( 'suffix-fallback' )
		).toBeVisible();
		await expect(
			page
				.getByTestId( 'ignores unique-ids' )
				.getByTestId( 'unique-id-fallback' )
		).toBeVisible();
	} );

	test( 'shows the fallback of created items, without their scripts, under Trusted Types enforcement', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const pageErrors = await openEnforcingPage(
			page,
			utils.getLink( 'test/directive-html' )
		);
		// Records each item's content when it is inserted, before paint.
		await page.evaluate( () => {
			const trackedWindow = window as typeof window & {
				insertedHTML: string[];
			};
			trackedWindow.insertedHTML = [];
			const list = document.querySelector(
				'[data-testid="fallback items"]'
			)!;
			new MutationObserver( ( records ) => {
				for ( const record of records ) {
					for ( const node of Array.from( record.addedNodes ) ) {
						if ( node instanceof HTMLLIElement ) {
							trackedWindow.insertedHTML.push(
								node.querySelector( 'div' )!.innerHTML
							);
						}
					}
				}
			} ).observe( list, { childList: true } );
		} );

		await page.getByTestId( 'add fallback' ).click();
		await page.getByTestId( 'add two fallbacks' ).click();
		const items = page.getByTestId( 'fallback items' ).locator( 'li div' );
		await expect( items ).toHaveCount( 3 );
		expect(
			await items.evaluateAll( ( elements ) =>
				elements.map( ( element ) => element.innerHTML )
			)
		).toEqual( Array( 3 ).fill( '<p>Loading</p>' ) );
		expect(
			await page.evaluate(
				() =>
					( window as typeof window & { insertedHTML: string[] } )
						.insertedHTML
			)
		).toEqual( Array( 3 ).fill( '<p>Loading</p>' ) );

		await page.getByTestId( 'add script items' ).click();
		const scriptItems = page
			.getByTestId( 'script items' )
			.locator( 'li div' );
		await expect( scriptItems ).toHaveCount( 2 );
		expect(
			await scriptItems.evaluateAll( ( elements ) =>
				elements.map( ( element ) => element.innerHTML )
			)
		).toEqual( [ '<p>Loading</p>', '<p>Loading</p>' ] );
		expect(
			await page.evaluate(
				() =>
					( window as typeof window & { fallbackRuns?: number } )
						.fallbackRuns
			)
		).toBeUndefined();

		expect( await readViolations( page ) ).toEqual( [] );
		expect( pageErrors ).toEqual( [] );
	} );

	test( 'never passes the fallback of created items through a default Trusted Types policy', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		// The default policy turns paragraphs into `em` elements, so any
		// string write of the fallback would change it.
		const pageErrors = await openEnforcingPage(
			page,
			utils.getLink( 'test/directive-html' ),
			'transform'
		);
		await page.getByTestId( 'add fallback' ).click();
		await expect
			.poll( () =>
				page
					.getByTestId( 'fallback items' )
					.locator( 'li div' )
					.innerHTML()
			)
			.toBe( '<p>Loading</p>' );
		expect( await readViolations( page ) ).toEqual( [] );
		expect( pageErrors ).toEqual( [] );
	} );

	test( 'shows a pending derived value fallback until its late getter resolves under Trusted Types enforcement', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const pageErrors = await openEnforcingPage(
			page,
			utils.getLink( 'test/directive-html' )
		);
		await page.getByTestId( 'add lazy item' ).click();
		const target = page.getByTestId( 'lazy items' ).locator( 'li div' );
		await expect.poll( () => target.innerHTML() ).toBe( '<p>Loading</p>' );
		await page.getByTestId( 'register lazy' ).click();
		await expect.poll( () => target.innerHTML() ).toBe( '<b>Late</b>' );
		expect( await readViolations( page ) ).toEqual( [] );
		expect( pageErrors ).toEqual( [] );
	} );
} );
