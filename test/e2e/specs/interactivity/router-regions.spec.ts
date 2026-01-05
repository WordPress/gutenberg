/**
 * External dependencies
 */
import { type Locator } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Router regions', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		const next = await utils.addPostWithBlock( 'test/router-regions', {
			alias: 'router regions - page 2',
			attributes: { page: 2 },
		} );
		await utils.addPostWithBlock( 'test/router-regions', {
			alias: 'router regions - page 1',
			attributes: { page: 1, next },
		} );

		// These pages are for testing router regions with `attachTo`.
		const region3 = {
			type: 'div',
			data: { id: 'region3', attachTo: 'body' },
		};
		const region4 = {
			type: 'div',
			data: { id: 'region4', attachTo: '#regions-with-attach-to' },
		};
		const region5 = {
			type: 'section',
			data: { id: 'region5', attachTo: 'body' },
		};
		const region6 = {
			type: 'section',
			hasDirectives: true,
			data: {
				id: 'region6',
				attachTo: '#regions-with-attach-to',
			},
		};
		const region7 = {
			type: 'section',
			data: { id: 'region7', attachTo: 'body' },
		};
		const region8 = {
			type: 'section',
			data: { id: 'region8', attachTo: '#regions-with-attach-to' },
		};

		const pageAttachTo2 = await utils.addPostWithBlock(
			'test/router-regions',
			{
				alias: 'router regions - page 2',
				attributes: {
					page: 'attachTo2',
					regionsWithAttachTo: [
						region3,
						region4,
						region5,
						region6,
						region7,
						region8,
					],
					counter: 10,
				},
			}
		);
		const pageAttachTo1 = await utils.addPostWithBlock(
			'test/router-regions',
			{
				alias: 'router regions - page 2',
				attributes: {
					page: 'attachTo1',
					next: pageAttachTo2,
					regionsWithAttachTo: [ region3, region4, region5, region6 ],
				},
			}
		);
		await utils.addPostWithBlock( 'test/router-regions', {
			alias: 'router regions - page 1 - attachTo',
			attributes: { page: 1, next: pageAttachTo1 },
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'router regions - page 1' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should be the only part hydrated', async ( { page } ) => {
		const region1Text = page.getByTestId( 'region-1-text' );
		const region2Text = page.getByTestId( 'region-2-text' );
		const noRegionText1 = page.getByTestId( 'no-region-text-1' );

		await expect( region1Text ).toHaveText( 'hydrated' );
		await expect( region2Text ).toHaveText( 'hydrated' );
		await expect( noRegionText1 ).toHaveText( 'not hydrated' );
	} );

	test( 'should update after navigation', async ( { page } ) => {
		const region1Ssr = page.getByTestId( 'region-1-ssr' );
		const region2Ssr = page.getByTestId( 'region-2-ssr' );

		await expect( region1Ssr ).toHaveText( 'content from page 1' );
		await expect( region2Ssr ).toHaveText( 'content from page 1' );

		await page.getByTestId( 'next' ).click();

		await expect( region1Ssr ).toHaveText( 'content from page 2' );
		await expect( region2Ssr ).toHaveText( 'content from page 2' );

		await page.getByTestId( 'back' ).click();

		await expect( region1Ssr ).toHaveText( 'content from page 1' );
		await expect( region2Ssr ).toHaveText( 'content from page 1' );
	} );

	test( 'should preserve state across pages', async ( { page } ) => {
		const counter = page.getByTestId( 'state-counter' );
		await expect( counter ).toHaveText( '0' );

		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '3' );

		await page.getByTestId( 'next' ).click();
		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '6' );

		await page.getByTestId( 'back' ).click();
		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '9' );
	} );

	test( 'should preserve context across pages', async ( { page } ) => {
		const counter = page.getByTestId( 'context-counter' );
		await expect( counter ).toHaveText( '0' );

		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '3' );

		await page.getByTestId( 'next' ).click();
		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '6' );

		await page.getByTestId( 'back' ).click();
		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '9' );
	} );

	test( 'can be nested', async ( { page } ) => {
		const nestedRegionSsr = page.getByTestId( 'nested-region-ssr' );
		const innerContent = page.getByTestId( 'nested-item' );

		await expect( nestedRegionSsr ).toHaveText( 'content from page 1' );
		await expect( innerContent ).toHaveCount( 3 );

		await page.getByTestId( 'next' ).click();
		await expect( nestedRegionSsr ).toHaveText( 'content from page 2' );
		await expect( innerContent ).toHaveCount( 3 );
		await page.getByTestId( 'add-item' ).click();
		await expect( innerContent ).toHaveCount( 4 );

		await page.getByTestId( 'back' ).click();
		await expect( nestedRegionSsr ).toHaveText( 'content from page 1' );
		await expect( innerContent ).toHaveCount( 4 );
	} );

	test( 'Page title is updated 2', async ( { page } ) => {
		await expect( page ).toHaveTitle(
			'router regions – page 1 – gutenberg'
		);
		await page.getByTestId( 'next' ).click();
		await expect( page ).toHaveTitle(
			'router regions – page 2 – gutenberg'
		);
		await page.getByTestId( 'back' ).click();
		await expect( page ).toHaveTitle(
			'router regions – page 1 – gutenberg'
		);
	} );

	test( 'should be updated when placed inside a `data-wp-interactive` element.', async ( {
		page,
	} ) => {
		const [
			validInsideInteractive,
			validInsideRouterRegion,
			invalidOutsideInteractive,
		] = [
			page.getByTestId( 'valid-inside-interactive' ),
			page.getByTestId( 'valid-inside-router-region' ),
			page.getByTestId( 'invalid-outside-interactive' ),
		];

		const [ validRegionText1, validRegionText2, invalidRegionText3 ] = [
			validInsideInteractive.getByTestId( 'text-1' ),
			validInsideRouterRegion.getByTestId( 'text-2' ),
			invalidOutsideInteractive.getByTestId( 'text-3' ),
		];
		const [ counter1, counter2 ] = [
			page.getByTestId( 'valid-inside-interactive-counter' ),
			page.getByTestId( 'valid-inside-router-region-counter' ),
		];

		await expect( validRegionText1 ).toHaveText( 'content from page 1' );
		await expect( validRegionText2 ).toHaveText( 'content from page 1' );
		await expect( invalidRegionText3 ).toHaveText( 'content from page 1' );

		await counter1.click();
		await counter2.click();
		await expect( counter1 ).toHaveText( '1' );
		await expect( counter2 ).toHaveText( '1' );

		await page.getByTestId( 'next' ).click();
		// Waits until the navigation finishes so it doesn't read the text from
		// the previous page.
		await expect( page ).toHaveTitle(
			'router regions – page 2 – gutenberg'
		);
		await expect( validRegionText1 ).toHaveText( 'content from page 2' );
		await expect( validRegionText2 ).toHaveText( 'content from page 2' );
		await expect( invalidRegionText3 ).toHaveText( 'content from page 1' );

		await counter1.click();
		await counter2.click();
		await expect( counter1 ).toHaveText( '2' );
		await expect( counter2 ).toHaveText( '2' );

		await page.getByTestId( 'back' ).click();
		// Waits until the navigation finishes so it doesn't read the text from
		// the previous page.
		await expect( page ).toHaveTitle(
			'router regions – page 1 – gutenberg'
		);
		await expect( validRegionText1 ).toHaveText( 'content from page 1' );
		await expect( validRegionText2 ).toHaveText( 'content from page 1' );
		await expect( invalidRegionText3 ).toHaveText( 'content from page 1' );

		await counter1.click();
		await counter2.click();
		await expect( counter1 ).toHaveText( '3' );
		await expect( counter2 ).toHaveText( '3' );
	} );

	test( 'should support router regions with the `attachTo` property.', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		await page.goto(
			utils.getLink( 'router regions - page 1 - attachTo' )
		);

		const bodyLocator = page.locator( 'body' );
		const regionsLocator = page.locator( '#regions-with-attach-to' );

		const region3 = bodyLocator.getByTestId( 'region3' );
		const region4 = regionsLocator.getByTestId( 'region4' );
		const region5 = bodyLocator.getByTestId( 'region5' );
		const region6 = regionsLocator.getByTestId( 'region6' );

		const regions: Record< string, Locator > = {
			region3,
			region4,
			region5,
			region6,
		};

		const initCount = page.getByTestId( 'init-count' );

		// The text of this element is used to check a navigation is completed.
		const region1Ssr = page.getByTestId( 'region-1-ssr' );

		await expect( region1Ssr ).toHaveText( 'content from page 1' );

		// Regions with `attachTo` should initially be hidden.
		await expect( region3 ).toBeHidden();
		await expect( region4 ).toBeHidden();
		await expect( region5 ).toBeHidden();
		await expect( region6 ).toBeHidden();

		// Navigate to "Page attachTo 1".
		await page.getByTestId( 'next' ).click();

		await expect( region1Ssr ).toHaveText( 'content from page attachTo1' );

		// Regions should appear in place, be hydrated, and interactive.
		for ( const regionId in regions ) {
			const region = regions[ regionId ];
			await expect( region ).toBeVisible();

			const text = region.getByTestId( 'text' );
			const clientCounter = region.getByTestId( 'client-counter' );
			const serverCounter = region.getByTestId( 'server-counter' );

			await expect( text ).toHaveText( regionId );
			await expect( clientCounter ).toHaveText( '0' );
			await expect( serverCounter ).toHaveText( '0' );

			await clientCounter.click( { clickCount: 3, delay: 50 } );
			await expect( clientCounter ).toHaveText( '3' );
		}

		// Region 6 has an init directive that should have been executed.
		await expect( initCount ).toHaveText( '1' );

		// Navigate to "Page attachTo 2".
		await page.getByTestId( 'next' ).click();
		await expect( region1Ssr ).toHaveText( 'content from page attachTo2' );

		// Check that regions remains hydrated and interactive.
		for ( const regionId in regions ) {
			const region = regions[ regionId ];
			await expect( region ).toBeVisible();

			const text = region.getByTestId( 'text' );
			const clientCounter = region.getByTestId( 'client-counter' );
			const serverCounter = region.getByTestId( 'server-counter' );

			await expect( text ).toHaveText( regionId );
			await expect( clientCounter ).toHaveText( '3' );
			await expect( serverCounter ).toHaveText( '10' );

			await clientCounter.click( { clickCount: 3, delay: 50 } );
			await expect( clientCounter ).toHaveText( '6' );
		}

		// Navigate back to "Page attachTo 1".
		await page.goBack();

		await expect( region1Ssr ).toHaveText( 'content from page attachTo1' );

		// Check that regions remains hydrated and interactive.
		for ( const regionId in regions ) {
			const region = regions[ regionId ];
			await expect( region ).toBeVisible();

			const text = region.getByTestId( 'text' );
			const clientCounter = region.getByTestId( 'client-counter' );
			const serverCounter = region.getByTestId( 'server-counter' );

			await expect( text ).toHaveText( regionId );
			await expect( clientCounter ).toHaveText( '6' );
			await expect( serverCounter ).toHaveText( '0' );

			await clientCounter.click( { clickCount: 3, delay: 50 } );
			await expect( clientCounter ).toHaveText( '9' );
		}

		// Navigate back to the initial page.
		await page.goBack();

		await expect( region1Ssr ).toHaveText( 'content from page 1' );

		// Regions should be unmounted.
		await expect( region3 ).toBeHidden();
		await expect( region4 ).toBeHidden();
		await expect( region5 ).toBeHidden();
		await expect( region6 ).toBeHidden();

		await page.goForward();

		await expect( region1Ssr ).toHaveText( 'content from page attachTo1' );

		// Regions should b reset when mounted again.
		for ( const regionId in regions ) {
			const region = regions[ regionId ];
			await expect( region ).toBeVisible();

			const text = region.getByTestId( 'text' );
			const clientCounter = region.getByTestId( 'client-counter' );
			const serverCounter = region.getByTestId( 'server-counter' );

			await expect( text ).toHaveText( regionId );
			await expect( clientCounter ).toHaveText( '0' );
			await expect( serverCounter ).toHaveText( '0' );
		}

		// Region 6 has an init directive that should have been executed again.
		await expect( initCount ).toHaveText( '2' );
	} );

	test( 'should support multiple regions with the `attachTo` property added at different times', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		await page.goto(
			utils.getLink( 'router regions - page 1 - attachTo' )
		);

		const region7 = page.locator( 'body' ).getByTestId( 'region7' );
		const region8 = page
			.locator( '#regions-with-attach-to' )
			.getByTestId( 'region8' );

		// The text of this element is used to check a navigation is completed.
		const region1Ssr = page.getByTestId( 'region-1-ssr' );

		await expect( region1Ssr ).toHaveText( 'content from page 1' );

		// Regions with `attachTo` should initially be hidden.
		await expect( region7 ).toBeHidden();
		await expect( region8 ).toBeHidden();

		const regions: Record< string, Locator > = {
			region7,
			region8,
		};

		// Navigate to "Page attachTo 1".
		await page.getByTestId( 'next' ).click();

		await expect( region1Ssr ).toHaveText( 'content from page attachTo1' );

		// Regions with `attachTo` should be hidden in "Page attachTo 1".
		await expect( region7 ).toBeHidden();
		await expect( region8 ).toBeHidden();

		// Navigate to "Page attachTo 2".
		await page.getByTestId( 'next' ).click();
		await expect( region1Ssr ).toHaveText( 'content from page attachTo2' );

		// Check that regions remains hydrated and interactive.
		for ( const regionId in regions ) {
			const region = regions[ regionId ];
			await expect( region ).toBeVisible();

			const text = region.getByTestId( 'text' );
			const clientCounter = region.getByTestId( 'client-counter' );
			const serverCounter = region.getByTestId( 'server-counter' );

			await expect( text ).toHaveText( regionId );
			await expect( clientCounter ).toHaveText( '10' );
			await expect( serverCounter ).toHaveText( '10' );

			await clientCounter.click( { clickCount: 3, delay: 50 } );
			await expect( clientCounter ).toHaveText( '13' );
		}

		// Navigate back to "Page attachTo 1".
		await page.goBack();

		await expect( region1Ssr ).toHaveText( 'content from page attachTo1' );

		// Regions with `attachTo` should be hidden in "Page attachTo 1".
		await expect( region7 ).toBeHidden();
		await expect( region8 ).toBeHidden();

		// Navigate back to the initial page.
		await page.goBack();

		await expect( region1Ssr ).toHaveText( 'content from page 1' );

		// Regions should be unmounted.
		await expect( region7 ).toBeHidden();
		await expect( region8 ).toBeHidden();

		await page.goForward();

		await expect( region1Ssr ).toHaveText( 'content from page attachTo1' );

		// Regions should still be unmounted.
		await expect( region7 ).toBeHidden();
		await expect( region8 ).toBeHidden();

		await page.goForward();

		await expect( region1Ssr ).toHaveText( 'content from page attachTo2' );

		// Regions should still be unmounted.
		await expect( region7 ).toBeVisible();
		await expect( region8 ).toBeVisible();
	} );
} );
