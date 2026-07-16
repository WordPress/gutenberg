/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-preserve', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-preserve' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-preserve' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should keep DOM injected by a third-party script across navigation', async ( {
		page,
	} ) => {
		// Simulate a third-party script injecting DOM into the preserved
		// wrapper after the page has loaded.
		await page.evaluate( () => {
			const widget = document.getElementById( 'preserved-widget' )!;
			const injected = document.createElement( 'div' );
			injected.dataset.testid = 'injected-widget';
			injected.textContent = 'Injected by a third-party script';
			widget.appendChild( injected );
		} );

		await page.getByTestId( 'navigate' ).click();

		// Wait for the navigation to actually complete.
		await expect( page.getByTestId( 'page-label' ) ).toHaveText( 'Page 2' );

		// The element injected by the "third-party script" is still there.
		await expect( page.getByTestId( 'injected-widget' ) ).toHaveText(
			'Injected by a third-party script'
		);

		// The original content is kept as is, the new page's server-rendered
		// content for the same wrapper is never applied.
		await expect( page.getByTestId( 'original-content' ) ).toHaveText(
			'Original server content'
		);
	} );

	test( 'should keep the exact same live DOM node across navigation', async ( {
		page,
	} ) => {
		// Tag the actual DOM node so we can check afterwards that the very
		// same node (not just visually identical content) survived.
		await page.getByTestId( 'original-content' ).evaluate( ( n ) => {
			( n as any )._marker = 'still-the-same-node';
		} );

		await page.getByTestId( 'navigate' ).click();
		await expect( page.getByTestId( 'page-label' ) ).toHaveText( 'Page 2' );

		const marker = await page
			.getByTestId( 'original-content' )
			.evaluate( ( n ) => ( n as any )._marker );
		expect( marker ).toBe( 'still-the-same-node' );
	} );
} );
