import { test, expect } from './fixtures';

test.describe( 'Router regions outside HTML content', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	for ( const before of [ false, true ] ) {
		test( `ignores fallback copies through navigation and history (copy before: ${ before })`, async ( {
			page,
			interactivityUtils: utils,
		} ) => {
			const next = await utils.addPostWithBlock(
				'test/router-html-regions',
				{
					attributes: { letter: 'B', before },
				}
			);
			const initial = await utils.addPostWithBlock(
				'test/router-html-regions',
				{
					attributes: { letter: 'A', next, before },
				}
			);
			await page.goto( initial );
			// Confirm the actual processed response contains the untouched copy.
			const response = await page.request.get( initial );
			const markup = await response.text();
			expect( markup ).toMatch(
				/data-testid="copy" data-wp-interactive="router-html-regions" data-wp-router-region="html\/r" data-wp-init="actions.mark"><p>copy<\/p>/
			);
			await expect( page.getByTestId( 'real' ) ).toHaveText( 'A' );
			await expect(
				page.getByTestId( 'html-owner' ).getByTestId( 'copy' )
			).toHaveText( 'copy' );
			await expect( page.getByTestId( 'marks' ) ).toHaveText( '0' );
			await page.getByTestId( 'next' ).click();
			for ( const [ index, letter ] of [
				'B',
				'A',
				'B',
				'A',
			].entries() ) {
				await expect( page.getByTestId( 'real' ) ).toHaveText( letter );
				await expect(
					page.getByTestId( 'html-owner' ).getByTestId( 'copy' )
				).toHaveText( 'copy' );
				await expect( page.getByTestId( 'copy' ) ).toHaveCount( 1 );
				await expect( page.getByTestId( 'marks' ) ).toHaveText( '0' );
				if ( index === 0 || index === 2 ) {
					await page.goBack();
				} else if ( index === 1 ) {
					await page.goForward();
				}
			}
		} );
	}

	test( 'attaches a real region despite an initial fallback copy with attachTo', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		for ( const copy of [ false, true ] ) {
			const next = await utils.addPostWithBlock(
				'test/router-html-regions',
				{
					attributes: { letter: 'B', mode: 'attach', copy },
				}
			);
			const initial = await utils.addPostWithBlock(
				'test/router-html-regions',
				{
					attributes: { letter: 'A', mode: 'attach', copy, next },
				}
			);
			await page.goto( initial );
			await expect( page.getByTestId( 'real' ) ).toHaveCount( 0 );
			await expect(
				page.locator( 'body > [data-testid="copy"]' )
			).toHaveCount( 0 );
			await page.getByTestId( 'next' ).click();
			await expect(
				page.locator( 'body > [data-testid="real"]' )
			).toHaveText( 'overlay B' );
			await expect( page.getByTestId( 'real' ) ).toHaveCount( 1 );
			await expect(
				page.locator( 'body > [data-testid="copy"]' )
			).toHaveCount( 0 );
			await expect( page.getByTestId( 'marks' ) ).toHaveText( '0' );
			await expect(
				page.getByTestId( 'html-owner' ).getByTestId( 'copy' )
			).toHaveCount( copy ? 1 : 0 );
			await expect(
				page.getByTestId( 'html-owner' ).getByTestId( 'copy' )
			).toHaveText( copy ? [ 'copy' ] : [] );
		}
	} );

	test( 'restores real content rather than a region inserted during hydration', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const next = await utils.addPostWithBlock( 'test/router-html-regions', {
			attributes: { letter: 'B', mode: 'inserted' },
		} );
		const initial = await utils.addPostWithBlock(
			'test/router-html-regions',
			{
				attributes: { letter: 'A', mode: 'inserted', next },
			}
		);
		await page.goto( initial );
		await expect( page.getByTestId( 'html-owner' ) ).toHaveText(
			'inserted'
		);
		await expect( page.getByTestId( 'real' ) ).toHaveText( 'A' );
		await page.getByTestId( 'next' ).click();
		await expect( page.getByTestId( 'real' ) ).toHaveText( 'B' );
		await page.goBack();
		await expect( page.getByTestId( 'real' ) ).toHaveText( 'A' );
		await expect( page.getByTestId( 'html-owner' ) ).toHaveText(
			'inserted'
		);
	} );
} );
