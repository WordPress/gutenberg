/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-each', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-each' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-each' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should use `item` as the default item name in the context', async ( {
		page,
	} ) => {
		const elements = page.getByTestId( 'letters' ).getByTestId( 'item' );
		await expect( elements ).toHaveText( [ 'A', 'B', 'C' ] );
	} );

	test( 'should use the specified item name in the context', async ( {
		page,
	} ) => {
		const elements = page.getByTestId( 'fruits' ).getByTestId( 'item' );
		await expect( elements ).toHaveText( [
			'avocado',
			'banana',
			'cherimoya',
		] );
	} );

	test( 'should convert from kebab-case to camelCase the specified item name in the context', async ( {
		page,
	} ) => {
		const elements = page
			.getByTestId( 'letters-kebab-case' )
			.getByTestId( 'item' );
		await expect( elements ).toHaveText( [ 'A', 'B', 'C' ] );
	} );

	test.describe( 'without `wp-each-key`', () => {
		test.beforeEach( async ( { page } ) => {
			const elements = page.getByTestId( 'fruits' ).getByTestId( 'item' );

			// These tags are included to check that the elements are not unmounted
			// and mounted again. If an element remounts, its tag should be missing.
			await elements.evaluateAll( ( refs ) =>
				refs.forEach( ( ref, index ) => {
					if ( ref instanceof HTMLElement ) {
						ref.dataset.tag = `${ index }`;
					}
				} )
			);
		} );

		test( 'should preserve elements on deletion', async ( { page } ) => {
			const elements = page.getByTestId( 'fruits' ).getByTestId( 'item' );

			// An item is removed when clicked.
			await elements.first().click();

			await expect( elements ).toHaveText( [ 'banana', 'cherimoya' ] );
			await expect( elements.getByText( 'avocado' ) ).toBeHidden();

			// Get the tags. They should not have disappeared.
			const [ banana, cherimoya ] = await elements.all();
			await expect( banana ).toHaveAttribute( 'data-tag', '1' );
			await expect( cherimoya ).toHaveAttribute( 'data-tag', '2' );
		} );

		test( 'should preserve elements on reordering', async ( { page } ) => {
			const elements = page.getByTestId( 'fruits' ).getByTestId( 'item' );

			await page.getByTestId( 'fruits' ).getByTestId( 'rotate' ).click();

			await expect( elements ).toHaveText( [
				'cherimoya',
				'avocado',
				'banana',
			] );

			// Get the tags. They should not have disappeared or changed.
			const [ cherimoya, avocado, banana ] = await elements.all();
			await expect( cherimoya ).toHaveAttribute( 'data-tag', '2' );
			await expect( avocado ).toHaveAttribute( 'data-tag', '0' );
			await expect( banana ).toHaveAttribute( 'data-tag', '1' );
		} );

		test( 'should preserve elements on addition', async ( { page } ) => {
			const elements = page.getByTestId( 'fruits' ).getByTestId( 'item' );

			await page.getByTestId( 'fruits' ).getByTestId( 'add' ).click();

			await expect( elements ).toHaveText( [
				'ananas',
				'avocado',
				'banana',
				'cherimoya',
			] );

			// Get the tags. They should not have disappeared or changed,
			// except for the newly created element.
			const [ ananas, avocado, banana, cherimoya ] = await elements.all();
			await expect( ananas ).not.toHaveAttribute( 'data-tag' );
			await expect( avocado ).toHaveAttribute( 'data-tag', '0' );
			await expect( banana ).toHaveAttribute( 'data-tag', '1' );
			await expect( cherimoya ).toHaveAttribute( 'data-tag', '2' );
		} );

		test( 'should preserve elements on replacement', async ( { page } ) => {
			const elements = page.getByTestId( 'fruits' ).getByTestId( 'item' );

			await page.getByTestId( 'fruits' ).getByTestId( 'replace' ).click();

			await expect( elements ).toHaveText( [
				'ananas',
				'banana',
				'cherimoya',
			] );

			// Get the tags. They should not have disappeared or changed,
			// except for the newly created element.
			const [ ananas, banana, cherimoya ] = await elements.all();
			await expect( ananas ).not.toHaveAttribute( 'data-tag' );
			await expect( banana ).toHaveAttribute( 'data-tag', '1' );
			await expect( cherimoya ).toHaveAttribute( 'data-tag', '2' );
		} );
	} );

	test.describe( 'with `wp-each-key`', () => {
		test.beforeEach( async ( { page } ) => {
			const elements = page.getByTestId( 'books' ).getByTestId( 'item' );

			// These tags are included to check that the elements are not unmounted
			// and mounted again. If an element remounts, its tag should be missing.
			await elements.evaluateAll( ( refs ) =>
				refs.forEach( ( ref, index ) => {
					if ( ref instanceof HTMLElement ) {
						ref.dataset.tag = `${ index }`;
					}
				} )
			);
		} );

		test( 'should preserve elements on deletion', async ( { page } ) => {
			const elements = page.getByTestId( 'books' ).getByTestId( 'item' );

			await expect( elements ).toHaveText( [
				'A Game of Thrones',
				'A Clash of Kings',
				'A Storm of Swords',
			] );

			// An item is removed when clicked.
			await elements.first().click();

			await expect( elements ).toHaveText( [
				'A Clash of Kings',
				'A Storm of Swords',
			] );

			// Get the tags. They should not have disappeared.
			const [ acok, asos ] = await elements.all();
			await expect( acok ).toHaveAttribute( 'data-tag', '1' );
			await expect( asos ).toHaveAttribute( 'data-tag', '2' );
		} );

		test( 'should preserve elements on reordering', async ( { page } ) => {
			const elements = page.getByTestId( 'books' ).getByTestId( 'item' );

			await page.getByTestId( 'books' ).getByTestId( 'rotate' ).click();

			await expect( elements ).toHaveText( [
				'A Storm of Swords',
				'A Game of Thrones',
				'A Clash of Kings',
			] );

			// Get the tags. They should not have disappeared or changed.
			const [ asos, agot, acok ] = await elements.all();
			await expect( asos ).toHaveAttribute( 'data-tag', '2' );
			await expect( agot ).toHaveAttribute( 'data-tag', '0' );
			await expect( acok ).toHaveAttribute( 'data-tag', '1' );
		} );

		test( 'should preserve elements on addition', async ( { page } ) => {
			const elements = page.getByTestId( 'books' ).getByTestId( 'item' );

			await page.getByTestId( 'books' ).getByTestId( 'add' ).click();

			await expect( elements ).toHaveText( [
				'A Feast for Crows',
				'A Game of Thrones',
				'A Clash of Kings',
				'A Storm of Swords',
			] );

			// Get the tags. They should not have disappeared or changed,
			// except for the newly created element.
			const [ affc, agot, acok, asos ] = await elements.all();
			await expect( affc ).not.toHaveAttribute( 'data-tag' );
			await expect( agot ).toHaveAttribute( 'data-tag', '0' );
			await expect( acok ).toHaveAttribute( 'data-tag', '1' );
			await expect( asos ).toHaveAttribute( 'data-tag', '2' );
		} );

		test( 'should preserve elements on replacement', async ( { page } ) => {
			const elements = page.getByTestId( 'books' ).getByTestId( 'item' );

			await page.getByTestId( 'books' ).getByTestId( 'replace' ).click();

			await expect( elements ).toHaveText( [
				'A Feast for Crows',
				'A Clash of Kings',
				'A Storm of Swords',
			] );

			// Get the tags. They should not have disappeared or changed,
			// except for the newly created element.
			const [ affc, acok, asos ] = await elements.all();
			await expect( affc ).not.toHaveAttribute( 'data-tag' );
			await expect( acok ).toHaveAttribute( 'data-tag', '1' );
			await expect( asos ).toHaveAttribute( 'data-tag', '2' );
		} );

		test( 'should preserve elements on modification', async ( {
			page,
		} ) => {
			const elements = page.getByTestId( 'books' ).getByTestId( 'item' );

			await page.getByTestId( 'books' ).getByTestId( 'modify' ).click();

			await expect( elements ).toHaveText( [
				'A GAME OF THRONES',
				'A Clash of Kings',
				'A Storm of Swords',
			] );

			// Get the tags. They should not have disappeared or changed.
			const [ agot, acok, asos ] = await elements.all();
			await expect( agot ).toHaveAttribute( 'data-tag', '0' );
			await expect( acok ).toHaveAttribute( 'data-tag', '1' );
			await expect( asos ).toHaveAttribute( 'data-tag', '2' );
		} );
	} );

	test( 'should respect elements after', async ( { page } ) => {
		const elements = page.getByTestId( 'numbers' ).getByTestId( 'item' );
		await expect( elements ).toHaveText( [ '1', '2', '3', '4' ] );
		await page.getByTestId( 'numbers' ).getByTestId( 'shift' ).click();
		await expect( elements ).toHaveText( [ '2', '3', '4' ] );
		await page
			.getByTestId( 'numbers' )
			.getByTestId( 'unshift' )
			.click( { clickCount: 2 } );
		await expect( elements ).toHaveText( [ '0', '1', '2', '3', '4' ] );
	} );

	test( 'should support initial empty lists', async ( { page } ) => {
		const elements = page.getByTestId( 'empty' ).getByTestId( 'item' );
		await expect( elements ).toHaveText( [ 'item X' ] );
		await page
			.getByTestId( 'empty' )
			.getByTestId( 'add' )
			.click( { clickCount: 2 } );

		await expect( elements ).toHaveText( [ 'item 0', 'item 1', 'item X' ] );
	} );

	test( 'should support multiple siblings inside the template', async ( {
		page,
	} ) => {
		const elements = page.getByTestId( 'siblings' ).getByTestId( 'item' );
		await expect( elements ).toHaveText( [
			'two',
			'2',
			'three',
			'3',
			'four',
			'4',
		] );
		await page.getByTestId( 'siblings' ).getByTestId( 'unshift' ).click();
		await expect( elements ).toHaveText( [
			'one',
			'1',
			'two',
			'2',
			'three',
			'3',
			'four',
			'4',
		] );
	} );

	test( 'should work on navigation', async ( { page } ) => {
		const elements = page
			.getByTestId( 'navigation-updated list' )
			.getByTestId( 'item' );

		// These tags are included to check that the elements are not unmounted
		// and mounted again. If an element remounts, its tag should be missing.
		await elements.evaluateAll( ( refs ) =>
			refs.forEach( ( ref, index ) => {
				if ( ref instanceof HTMLElement ) {
					ref.dataset.tag = `${ index }`;
				}
			} )
		);

		await expect( elements ).toHaveText( [ 'b', 'c', 'd' ] );

		await page
			.getByTestId( 'navigation-updated list' )
			.getByTestId( 'navigate' )
			.click();

		await expect( elements ).toHaveText( [ 'a', 'b', 'c', 'd' ] );

		// Get the tags. They should not have disappeared or changed,
		// except for the newly created element.
		const [ alpha, beta, gamma, delta ] = await elements.all();
		await expect( alpha ).not.toHaveAttribute( 'data-tag' );
		await expect( beta ).toHaveAttribute( 'data-tag', '0' );
		await expect( gamma ).toHaveAttribute( 'data-tag', '1' );
		await expect( delta ).toHaveAttribute( 'data-tag', '2' );
	} );

	test( 'should work with nested lists', async ( { page } ) => {
		const mainElement = page.getByTestId( 'nested' );

		// These tags are included to check that the elements are not unmounted
		// and mounted again. If an element remounts, its tag should be missing.
		const listItems = mainElement.getByRole( 'listitem' );
		await listItems.evaluateAll( ( refs ) =>
			refs.forEach( ( ref, index ) => {
				if ( ref instanceof HTMLElement ) {
					ref.dataset.tag = `${ index }`;
				}
			} )
		);

		const animals = mainElement.getByTestId( 'animal' );

		{
			// Ensure it hydrates correctly.
			const [ dog, cat ] = await animals.all();
			await expect( dog.getByTestId( 'name' ) ).toHaveText( 'Dog' );
			await expect( dog.getByRole( 'listitem' ) ).toHaveText( [
				'chihuahua',
				'rottweiler',
			] );
			await expect( cat.getByTestId( 'name' ) ).toHaveText( 'Cat' );
			await expect( cat.getByRole( 'listitem' ) ).toHaveText( [
				'sphynx',
				'siamese',
			] );
		}

		await mainElement.getByTestId( 'add animal' ).click();

		{
			// Ensure it works when the top list is modified.
			const [ rat, dog, cat ] = await animals.all();
			await expect( rat.getByTestId( 'name' ) ).toHaveText( 'Rat' );
			await expect( rat.getByRole( 'listitem' ) ).toHaveText( [
				'dumbo',
				'rex',
			] );
			await expect( dog.getByTestId( 'name' ) ).toHaveText( 'Dog' );
			await expect( dog.getByRole( 'listitem' ) ).toHaveText( [
				'chihuahua',
				'rottweiler',
			] );
			await expect( cat.getByTestId( 'name' ) ).toHaveText( 'Cat' );
			await expect( cat.getByRole( 'listitem' ) ).toHaveText( [
				'sphynx',
				'siamese',
			] );
			await expect( rat ).not.toHaveAttribute( 'data-tag' );
			const [ d1, d2 ] = await dog.getByRole( 'listitem' ).all();
			await expect( dog ).toHaveAttribute( 'data-tag', '0' );
			await expect( d1 ).toHaveAttribute( 'data-tag', '1' );
			await expect( d2 ).toHaveAttribute( 'data-tag', '2' );
			const [ c1, c2 ] = await cat.getByRole( 'listitem' ).all();
			await expect( cat ).toHaveAttribute( 'data-tag', '3' );
			await expect( c1 ).toHaveAttribute( 'data-tag', '4' );
			await expect( c2 ).toHaveAttribute( 'data-tag', '5' );
		}

		// Reset tags so the added elements have one.
		await listItems.evaluateAll( ( refs ) =>
			refs.forEach( ( ref, index ) => {
				if ( ref instanceof HTMLElement ) {
					ref.dataset.tag = `${ index }`;
				}
			} )
		);

		await mainElement.getByTestId( 'add breeds' ).click();

		{
			// Ensure it works when the top list is modified.
			const [ rat, dog, cat ] = await animals.all();
			await expect( rat.getByTestId( 'name' ) ).toHaveText( 'Rat' );
			await expect( rat.getByRole( 'listitem' ) ).toHaveText( [
				'satin',
				'dumbo',
				'rex',
			] );
			await expect( dog.getByTestId( 'name' ) ).toHaveText( 'Dog' );
			await expect( dog.getByRole( 'listitem' ) ).toHaveText( [
				'german shepherd',
				'chihuahua',
				'rottweiler',
			] );
			await expect( cat.getByTestId( 'name' ) ).toHaveText( 'Cat' );
			await expect( cat.getByRole( 'listitem' ) ).toHaveText( [
				'maine coon',
				'sphynx',
				'siamese',
			] );
			const [ r1, r2, r3 ] = await rat.getByRole( 'listitem' ).all();
			await expect( rat ).toHaveAttribute( 'data-tag', '0' );
			await expect( r1 ).not.toHaveAttribute( 'data-tag' );
			await expect( r2 ).toHaveAttribute( 'data-tag', '1' );
			await expect( r3 ).toHaveAttribute( 'data-tag', '2' );
			const [ d1, d2, d3 ] = await dog.getByRole( 'listitem' ).all();
			await expect( dog ).toHaveAttribute( 'data-tag', '3' );
			await expect( d1 ).not.toHaveAttribute( 'data-tag' );
			await expect( d2 ).toHaveAttribute( 'data-tag', '4' );
			await expect( d3 ).toHaveAttribute( 'data-tag', '5' );
			const [ c1, c2, c3 ] = await cat.getByRole( 'listitem' ).all();
			await expect( cat ).toHaveAttribute( 'data-tag', '6' );
			await expect( c1 ).not.toHaveAttribute( 'data-tag' );
			await expect( c2 ).toHaveAttribute( 'data-tag', '7' );
			await expect( c3 ).toHaveAttribute( 'data-tag', '8' );
		}
	} );

	test( 'should do nothing when used on non-template elements', async ( {
		page,
	} ) => {
		const elements = page
			.getByTestId( 'invalid tag' )
			.getByTestId( 'item' );

		await expect( elements ).toHaveCount( 1 );
		await expect( elements ).toBeEmpty();
	} );

	test( 'should work with derived state as keys', async ( { page } ) => {
		const elements = page
			.getByTestId( 'derived state' )
			.getByTestId( 'item' );

		// These tags are included to check that the elements are not unmounted
		// and mounted again. If an element remounts, its tag should be missing.
		await elements.evaluateAll( ( refs ) =>
			refs.forEach( ( ref, index ) => {
				if ( ref instanceof HTMLElement ) {
					ref.dataset.tag = `${ index }`;
				}
			} )
		);

		await page
			.getByTestId( 'derived state' )
			.getByTestId( 'rotate' )
			.click();

		await expect( elements ).toHaveText( [
			'cherimoya',
			'avocado',
			'banana',
		] );

		// Get the tags. They should not have disappeared or changed.
		const [ cherimoya, avocado, banana ] = await elements.all();
		await expect( cherimoya ).toHaveAttribute( 'data-tag', '2' );
		await expect( avocado ).toHaveAttribute( 'data-tag', '0' );
		await expect( banana ).toHaveAttribute( 'data-tag', '1' );
	} );

	test( 'directives inside elements with `wp-each-child` should not run', async ( {
		page,
	} ) => {
		const element = page
			.getByTestId( 'elements with directives' )
			.getByTestId( 'item' );
		const callbackRunCount = page
			.getByTestId( 'elements with directives' )
			.getByTestId( 'callbackRunCount' );
		await expect( element ).toHaveText( 'beta' );
		await expect( callbackRunCount ).toHaveText( '1' );
	} );

	for ( const testId of [
		'each-with-unset',
		'each-with-null',
		'each-with-undefined',
	] ) {
		test( `does not error with non-iterable values: ${ testId }`, async ( {
			page,
		} ) => {
			await expect( page.getByTestId( testId ) ).toBeEmpty();
		} );
	}

	for ( const [ testId, values ] of [
		[ 'each-with-array', [ 'an', 'array' ] ],
		[ 'each-with-set', [ 'a', 'set' ] ],
		[ 'each-with-string', [ 's', 't', 'r' ] ],
		[ 'each-with-generator', [ 'a', 'generator' ] ],

		// TODO: Is there a problem with proxies here?
		// [ 'each-with-iterator', [ 'implements', 'iterator' ] ],
	] as const ) {
		test( `support different each iterable values: ${ testId }`, async ( {
			page,
		} ) => {
			const element = page.getByTestId( testId );
			for ( const value of values ) {
				await expect(
					element.getByText( value, { exact: true } )
				).toBeVisible();
			}
		} );
	}
} );
