import { test, expect } from './fixtures';

test.describe( 'Router HTML content', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
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
