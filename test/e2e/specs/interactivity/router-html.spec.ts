import { test, expect } from './fixtures';

test.describe( 'Router HTML content', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		for ( const value of [ 'T', 'U', 'null', 'pending' ] ) {
			const next = await utils.addPostWithBlock( 'test/router-html', {
				alias: `kept ${ value } two`,
				attributes: { page: 'two', value },
			} );
			await utils.addPostWithBlock( 'test/router-html', {
				alias: `kept ${ value } one`,
				attributes: { page: 'one', value: 'T', next },
			} );
		}
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	for ( const [ value, html ] of [
		[ 'T', '<p>T</p>' ],
		[ 'U', '<p>U</p>' ],
		[ 'null', '' ],
		[ 'pending', '<p>T</p>' ],
	] ) {
		test( `keeps node identity and follows the ${ value } destination without its fallback`, async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			await page.goto( utils.getLink( `kept ${ value } one` ) );
			const kept = page.getByTestId( 'kept-html' );
			const never = page.getByTestId( 'never-html' );
			await expect.poll( () => kept.innerHTML() ).toBe( '<p>T</p>' );
			await expect.poll( () => never.innerHTML() ).toBe( '' );
			await expect( page.getByTestId( 'value' ) ).toHaveText( 'T' );
			const originalKept = await kept.evaluateHandle( ( el ) => el );
			// Observe content at each native DOM mutation, not merely at paint.
			const contents = await kept.evaluateHandle( ( el ) => {
				const seen = [ el.innerHTML ];
				const descriptor = Object.getOwnPropertyDescriptor(
					Element.prototype,
					'innerHTML'
				)!;
				Object.defineProperty( el, 'innerHTML', {
					configurable: true,
					get: () => descriptor.get!.call( el ),
					set: ( markup: string ) => {
						descriptor.set!.call( el, markup );
						seen.push( el.innerHTML );
					},
				} );
				new MutationObserver( () => seen.push( el.innerHTML ) ).observe(
					el,
					{ childList: true, subtree: true, characterData: true }
				);
				return seen;
			} );
			await page
				.getByRole( 'link', { name: 'Next', exact: true } )
				.click();
			await expect( page.getByTestId( 'page-content' ) ).toHaveText(
				'content from two'
			);
			await expect( page.getByTestId( 'value' ) ).toHaveText( value );
			await expect.poll( () => kept.innerHTML() ).toBe( html );
			await expect.poll( () => never.innerHTML() ).toBe( '' );
			expect(
				await kept.evaluate(
					( el, original ) => el === original,
					originalKept
				)
			).toBe( true );
			expect( await contents.jsonValue() ).toEqual(
				value === 'pending' ? [ '<p>T</p>' ] : expect.any( Array )
			);
			if ( value === 'null' || value === 'pending' ) {
				await page
					.getByRole( 'button', { name: 'Resolve HTML' } )
					.click();
			}
			await expect
				.poll( () => kept.innerHTML() )
				.toBe(
					value === 'null' || value === 'pending' ? '<p>U</p>' : html
				);
			expect(
				await kept.evaluate(
					( el, original ) => el === original,
					originalKept
				)
			).toBe( true );
			expect( await contents.jsonValue() ).not.toContain( '<i>two</i>' );
			await contents.dispose();
			await originalKept.dispose();
		} );
	}
} );
