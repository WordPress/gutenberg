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

	test( 'does not enforce Trusted Types without the query argument', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const response = await page.goto(
			utils.getLink( 'test/directive-html' )
		);
		expect( response ).not.toBeNull();
		expect(
			response!.headers()[ 'content-security-policy' ]
		).toBeUndefined();
	} );

	test( 'renders late TrustedHTML without violations or errors under Trusted Types enforcement', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const url = new URL( utils.getLink( 'test/directive-html' ) );
		url.searchParams.set( 'require_trusted_types', 'true' );
		const response = await page.goto( url.href );
		expect( response ).not.toBeNull();
		expect( response!.headers()[ 'content-security-policy' ] ).toBe(
			"require-trusted-types-for 'script'"
		);
		await expect( page.getByTestId( 'hydration' ) ).toHaveText(
			'hydrated'
		);
		const el = page.getByTestId( 'show state html' );
		await expect( el.getByTestId( 'fallback' ) ).toBeVisible();

		// Collect only after hydration, so the observed writes are late updates.
		const pageErrors: Error[] = [];
		page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
		const violations = await page.evaluateHandle( () => {
			const events: string[] = [];
			document.addEventListener( 'securitypolicyviolation', ( event ) => {
				events.push( event.violatedDirective );
			} );
			return events;
		} );

		await page.getByTestId( 'set trusted html' ).click();
		await expect( el.locator( 'p' ) ).toHaveText( 'Late' );
		expect( await el.innerHTML() ).toBe( '<p>Late</p>' );
		// Give queued CSP violation events a chance to reach the collector.
		await page.evaluate(
			() =>
				new Promise< void >( ( resolve ) =>
					requestAnimationFrame( () =>
						requestAnimationFrame( () => resolve() )
					)
				)
		);
		expect( await violations.jsonValue() ).toEqual( [] );
		expect( pageErrors ).toEqual( [] );
		await violations.dispose();
	} );

	test( 'keeps the fallback for a rejected string token without errors under Trusted Types enforcement', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const url = new URL( utils.getLink( 'test/directive-html' ) );
		url.searchParams.set( 'require_trusted_types', 'true' );
		const response = await page.goto( url.href );
		expect( response ).not.toBeNull();
		expect( response!.headers()[ 'content-security-policy' ] ).toBe(
			"require-trusted-types-for 'script'"
		);
		await expect( page.getByTestId( 'hydration' ) ).toHaveText(
			'hydrated'
		);
		const el = page.getByTestId( 'show state html' );
		await expect( el.getByTestId( 'fallback' ) ).toBeVisible();

		// Collect only after hydration, so the observed writes are late updates.
		const pageErrors: Error[] = [];
		page.on( 'pageerror', ( error ) => pageErrors.push( error ) );
		const violations = await page.evaluateHandle( () => {
			const events: string[] = [];
			document.addEventListener( 'securitypolicyviolation', ( event ) => {
				events.push( event.violatedDirective );
			} );
			return events;
		} );

		await page.getByTestId( 'set html' ).click();
		// The rejection proves enforcement and that the action has run.
		await expect
			.poll( () => violations.jsonValue() )
			.toEqual( [ 'require-trusted-types-for' ] );
		await expect( el.getByTestId( 'fallback' ) ).toBeVisible();
		await expect( el.getByTestId( 'rendered-strong' ) ).toHaveCount( 0 );
		expect( pageErrors ).toEqual( [] );
		await violations.dispose();
	} );

	test( 'shows the server-rendered fallback before any HTML is set', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'show state html' );
		await expect( el.getByTestId( 'fallback' ) ).toBeVisible();
	} );

	test( 'renders trusted HTML from asDangerousHTML()', async ( { page } ) => {
		const el = page.getByTestId( 'show state html' );
		await page.getByTestId( 'set html' ).click();
		await expect( el.getByTestId( 'rendered-strong' ) ).toHaveText(
			'Rendered HTML'
		);
	} );

	test( 'keeps the last rendered HTML when the value becomes untrusted again', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'show state html' );
		await page.getByTestId( 'set html' ).click();
		await expect( el.getByTestId( 'rendered-strong' ) ).toBeVisible();
		await page.getByTestId( 'set loading' ).click();
		// The previously rendered HTML should still be there.
		await expect( el.getByTestId( 'rendered-strong' ) ).toBeVisible();
	} );

	test( 'does not render a plain string as HTML', async ( { page } ) => {
		const el = page.getByTestId( 'show state html' );
		await page.getByTestId( 'set plain string' ).click();
		await expect( el ).not.toContainText( 'Not rendered' );
		// The fallback should still be visible since a plain string never
		// resolved to trusted HTML.
		await expect( el.getByTestId( 'fallback' ) ).toBeVisible();
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
