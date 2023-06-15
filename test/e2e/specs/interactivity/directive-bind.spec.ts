/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'data-wp-bind', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin(
			'gutenberg-test-interactive-blocks'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin(
			'gutenberg-test-interactive-blocks'
		);
	} );

	let postId: number | null;

	test.beforeEach( async ( { admin, editor, page } ) => {
		// We only need to publish a new post the first time. Subsequent tests
		// will access to the same post.
		if ( ! postId ) {
			await admin.createNewPost();
			await editor.setContent( `<!-- wp:test/directive-bind /-->` );
			postId = await editor.publishPost();
		}
		await page.goto( `/?p=${ postId }` );
	} );

	test( 'add missing href at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'add missing href at hydration' );
		await expect( el ).toHaveAttribute( 'href', '/some-url' );
	} );

	test( 'change href at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'change href at hydration' );
		await expect( el ).toHaveAttribute( 'href', '/some-url' );
	} );

	test( 'update missing href at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'add missing href at hydration' );
		await expect( el ).toHaveAttribute( 'href', '/some-url' );
		await page.getByTestId( 'toggle' ).click();
		await expect( el ).toHaveAttribute( 'href', '/some-other-url' );
	} );

	test( 'add missing checked at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'add missing checked at hydration' );
		await expect( el ).toHaveAttribute( 'checked', '' );
	} );

	test( 'remove existing checked at hydration', async ( { page } ) => {
		const el = page.getByTestId( 'remove existing checked at hydration' );
		await expect( el ).not.toHaveAttribute( 'checked', '' );
	} );

	test( 'update existing checked', async ( { page } ) => {
		const el = page.getByTestId( 'add missing checked at hydration' );
		const el2 = page.getByTestId( 'remove existing checked at hydration' );
		let checked = await el.evaluate(
			( element: HTMLInputElement ) => element.checked
		);
		let checked2 = await el2.evaluate(
			( element: HTMLInputElement ) => element.checked
		);
		expect( checked ).toBe( true );
		expect( checked2 ).toBe( false );
		await page.getByTestId( 'toggle' ).click();
		checked = await el.evaluate(
			( element: HTMLInputElement ) => element.checked
		);
		checked2 = await el2.evaluate(
			( element: HTMLInputElement ) => element.checked
		);
		expect( checked ).toBe( false );
		expect( checked2 ).toBe( true );
	} );

	test( 'nested binds', async ( { page } ) => {
		const el = page.getByTestId( 'nested binds - 1' );
		await expect( el ).toHaveAttribute( 'href', '/some-url' );
		const el2 = page.getByTestId( 'nested binds - 2' );
		await expect( el2 ).toHaveAttribute( 'width', '1' );
		await page.getByTestId( 'toggle' ).click();
		await expect( el ).toHaveAttribute( 'href', '/some-other-url' );
		await expect( el2 ).toHaveAttribute( 'width', '2' );
	} );

	test( 'check enumerated attributes with true/false values', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'check enumerated attributes with true/false exist and have a string value'
		);
		await expect( el ).toHaveAttribute( 'hidden', '' );
		await expect( el ).toHaveAttribute( 'aria-hidden', 'true' );
		await expect( el ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( el ).toHaveAttribute( 'data-some-value', 'false' );
		await page.getByTestId( 'toggle' ).click();
		await expect( el ).not.toHaveAttribute( 'hidden', '' );
		await expect( el ).toHaveAttribute( 'aria-hidden', 'false' );
		await expect( el ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( el ).toHaveAttribute( 'data-some-value', 'true' );
	} );
} );
