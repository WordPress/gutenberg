import { test, expect } from './fixtures';

test.describe( 'Router HTML content', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		for ( const scenario of [ 'nested', 'attach' ] ) {
			const next = await utils.addPostWithBlock( 'test/router-html', {
				alias: `${ scenario } two`,
				attributes: { scenario, page: 'two' },
			} );
			await utils.addPostWithBlock( 'test/router-html', {
				alias: `${ scenario } one`,
				attributes: { scenario, page: 'one', next },
			} );
		}
		for ( const value of [ 'T', 'U', 'null' ] ) {
			const next = await utils.addPostWithBlock( 'test/router-html', {
				alias: `kept ${ value } two`,
				attributes: { scenario: 'kept', page: 'two', value },
			} );
			await utils.addPostWithBlock( 'test/router-html', {
				alias: `kept ${ value } one`,
				attributes: { scenario: 'kept', page: 'one', value: 'T', next },
			} );
		}
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'ignores a fallback region on the initial page and through back/forward navigation', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		await page.goto( utils.getLink( 'nested one' ) );
		await expect( page.getByTestId( 'hydration' ) ).toHaveText(
			'hydrated'
		);
		const region = page.getByTestId( 'main-region' );
		const count = page.getByTestId( 'mark-count' );
		await expect( region ).toHaveText( 'content from one Next' );
		await expect( page.getByTestId( 'inert-html' ) ).toHaveText( 'nested' );
		await expect( count ).toHaveText( '0' );
		// This island is outside the updated region; its node proves no reload.
		const originalCount = await count.evaluateHandle( ( el ) => el );

		await page.getByRole( 'link', { name: 'Next', exact: true } ).click();
		await expect( region ).toHaveText( 'content from two' );
		await expect( count ).toHaveText( '0' );
		expect(
			await count.evaluate(
				( el, original ) => el === original,
				originalCount
			)
		).toBe( true );

		await page.goBack();
		await expect( region ).toHaveText( 'content from one Next' );
		await expect( count ).toHaveText( '0' );
		expect(
			await count.evaluate(
				( el, original ) => el === original,
				originalCount
			)
		).toBe( true );

		await page.goForward();
		await expect( region ).toHaveText( 'content from two' );
		await expect( count ).toHaveText( '0' );
		await page.goBack();
		await expect( region ).toHaveText( 'content from one Next' );
		await expect( count ).toHaveText( '0' );
		expect(
			await count.evaluate(
				( el, original ) => el === original,
				originalCount
			)
		).toBe( true );
		await originalCount.dispose();
	} );

	test( 'attaches a legitimate region despite a same-id region in the initial fallback', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		await page.goto( utils.getLink( 'attach one' ) );
		await expect( page.getByTestId( 'hydration' ) ).toHaveText(
			'hydrated'
		);
		await expect(
			page.getByTestId( 'inert-html' ).getByTestId( 'attach-region' )
		).toHaveText( 'attached content from one' );
		const attached = page.locator( 'body > [data-testid="attach-region"]' );
		await expect( attached ).toHaveCount( 0 );
		const originalBody = await page
			.locator( 'body' )
			.evaluateHandle( ( el ) => el );

		await page.getByRole( 'link', { name: 'Next', exact: true } ).click();
		await expect( page.getByTestId( 'page-content' ) ).toHaveText(
			'content from two'
		);
		await expect( attached ).toHaveText( 'attached content from two' );
		await expect( attached ).toBeVisible();
		expect(
			await page
				.locator( 'body' )
				.evaluate( ( el, original ) => el === original, originalBody )
		).toBe( true );
		await originalBody.dispose();
	} );

	for ( const [ value, description, html ] of [
		[ 'T', 'the same token', '<p>T</p>' ],
		[ 'U', 'a different token', '<p>U</p>' ],
	] ) {
		test( `keeps the HTML node and renders ${ description } across navigation`, async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( `kept ${ value } one` ) );
			const kept = page.getByTestId( 'kept-html' );
			const never = page.getByTestId( 'never-html' );
			await expect( kept.locator( 'p' ) ).toHaveText( 'T' );
			await expect( never.locator( 'i' ) ).toHaveText( 'never one' );
			await expect( page.getByTestId( 'value' ) ).toHaveText( 'T' );
			// Keep references to both actual DOM nodes, not their attributes.
			const originalKept = await kept.evaluateHandle( ( el ) => el );
			const originalNever = await never.evaluateHandle( ( el ) => el );

			await page
				.getByRole( 'link', { name: 'Next', exact: true } )
				.click();
			await expect( page.getByTestId( 'page-content' ) ).toHaveText(
				'content from two'
			);
			// The readout proves the destination supplied its own value.
			await expect( page.getByTestId( 'value' ) ).toHaveText( value );
			await expect.poll( () => kept.innerHTML() ).toBe( html );
			await expect
				.poll( () => never.innerHTML() )
				.toBe( '<i>never two</i>' );
			expect(
				await kept.evaluate(
					( el, original ) => el === original,
					originalKept
				)
			).toBe( true );
			expect(
				await never.evaluate(
					( el, original ) => el === original,
					originalNever
				)
			).toBe( true );

			await originalKept.dispose();
			await originalNever.dispose();
		} );
	}

	test( 'keeps the HTML node and its trusted content for a null destination until a token resolves', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		await page.goto( utils.getLink( 'kept null one' ) );
		const kept = page.getByTestId( 'kept-html' );
		const never = page.getByTestId( 'never-html' );
		await expect( kept.locator( 'p' ) ).toHaveText( 'T' );
		await expect( never.locator( 'i' ) ).toHaveText( 'never one' );
		await expect( page.getByTestId( 'value' ) ).toHaveText( 'T' );
		const originalKept = await kept.evaluateHandle( ( el ) => el );
		const originalNever = await never.evaluateHandle( ( el ) => el );

		await page.getByRole( 'link', { name: 'Next', exact: true } ).click();
		await expect( page.getByTestId( 'page-content' ) ).toHaveText(
			'content from two'
		);
		// The destination supplies null, not the initial page's token.
		await expect( page.getByTestId( 'value' ) ).toHaveText( 'null' );
		await expect.poll( () => kept.innerHTML() ).toBe( '<p>T</p>' );
		await expect.poll( () => never.innerHTML() ).toBe( '<i>never two</i>' );
		expect(
			await kept.evaluate(
				( el, original ) => el === original,
				originalKept
			)
		).toBe( true );
		expect(
			await never.evaluate(
				( el, original ) => el === original,
				originalNever
			)
		).toBe( true );

		await page.getByRole( 'button', { name: 'Resolve HTML' } ).click();
		await expect.poll( () => kept.innerHTML() ).toBe( '<p>U</p>' );
		expect(
			await kept.evaluate(
				( el, original ) => el === original,
				originalKept
			)
		).toBe( true );
		await originalKept.dispose();
		await originalNever.dispose();
	} );
} );
