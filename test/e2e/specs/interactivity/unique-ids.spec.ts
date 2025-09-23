/**
 * External dependencies
 */
import type { Locator } from '@playwright/test';
/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

const parseContent = async ( loc: Locator ) =>
	JSON.parse( ( await loc.textContent() ) || '' );

test.describe( 'data-wp-*---unique-id', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/unique-ids' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/unique-ids' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'multiple context directives with unique IDs merge correctly', async ( {
		page,
	} ) => {
		const contextMerge = await parseContent(
			page.getByTestId( 'context-merge' )
		);

		expect( contextMerge ).toMatchObject( {
			propA: 'valueA',
			propB: 'valueB',
			shared: 'fromA', // First context's value wins (attribute order)
		} );
	} );

	test( 'context directives with unique IDs work with different namespaces', async ( {
		page,
	} ) => {
		const nsAText = await page.getByTestId( 'ns-a' ).textContent();
		const nsBText = await page.getByTestId( 'ns-b' ).textContent();

		expect( nsAText ).toBe( 'fromA' );
		expect( nsBText ).toBe( 'fromB' );
	} );

	test( 'multiple event handlers with unique IDs execute independently', async ( {
		page,
	} ) => {
		const button = page.getByTestId( 'multi-click' );
		const handler1Count = page.getByTestId( 'click-handler1-count' );
		const handler2Count = page.getByTestId( 'click-handler2-count' );

		// Initially both should be 0
		await expect( handler1Count ).toHaveText( '0' );
		await expect( handler2Count ).toHaveText( '0' );

		// Click the button
		await button.click();

		// Both handlers should have been called
		await expect( handler1Count ).toHaveText( '1' );
		await expect( handler2Count ).toHaveText( '1' );

		// Click again
		await button.click();

		// Both counts should increment
		await expect( handler1Count ).toHaveText( '2' );
		await expect( handler2Count ).toHaveText( '2' );
	} );

	test( 'multiple watch directives with unique IDs work correctly', async ( {
		page,
	} ) => {
		const incrementButton = page.getByTestId( 'increment-button' );
		const counter = page.getByTestId( 'counter' );
		const watcher1Count = page.getByTestId( 'watcher1-count' );
		const watcher2Count = page.getByTestId( 'watcher2-count' );

		// Initially counter should be 0, watchers should have been called on init
		await expect( counter ).toHaveText( '0' );
		await expect( watcher1Count ).toHaveText( '2' );
		await expect( watcher2Count ).toHaveText( '2' );

		// Increment counter
		await incrementButton.click();

		// Counter should be 1, both watchers should have been called again
		await expect( counter ).toHaveText( '1' );
		await expect( watcher1Count ).toHaveText( '3' );
		await expect( watcher2Count ).toHaveText( '3' );
	} );

	test( 'multiple init directives with unique IDs execute', async ( {
		page,
	} ) => {
		const init1Count = page.getByTestId( 'init1-count' );
		const init2Count = page.getByTestId( 'init2-count' );

		// Both init handlers should have been called once on initialization
		await expect( init1Count ).toHaveText( '1' );
		await expect( init2Count ).toHaveText( '1' );
	} );

	test( 'directives without unique IDs still work (backward compatibility)', async ( {
		page,
	} ) => {
		const button = page.getByTestId( 'backward-compat-button' );
		const text = page.getByTestId( 'backward-compat-text' );
		const handler1Count = page.getByTestId( 'click-handler1-count' );

		// Text should show context value
		await expect( text ).toHaveText( 'working' );

		// Get initial count
		const initialCount = parseInt(
			( await handler1Count.textContent() ) || '0'
		);

		// Click backward compatible button
		await button.click();

		// Handler should have been called
		await expect( handler1Count ).toHaveText(
			( initialCount + 1 ).toString()
		);
	} );

	test( 'complex suffixes with unique IDs work correctly', async ( {
		page,
	} ) => {
		const button = page.getByTestId( 'complex-suffix' );
		const handler1Count = page.getByTestId( 'click-handler1-count' );

		// Get initial count
		const initialCount = parseInt(
			( await handler1Count.textContent() ) || '0'
		);

		// Click button with complex suffix
		await button.click();

		// Handler should have been called
		await expect( handler1Count ).toHaveText(
			( initialCount + 1 ).toString()
		);
	} );
} );
