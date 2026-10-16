import { test, expect } from './fixtures';

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
} );
