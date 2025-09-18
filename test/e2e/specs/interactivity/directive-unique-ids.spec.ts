/**
 * External dependencies
 */
import type { Locator } from '@playwright/test';
/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

const parseContent = async ( loc: Locator ) =>
	JSON.parse( ( await loc.textContent() ) || '{}' );

test.describe( 'data-wp-* with unique IDs', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-unique-ids' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-unique-ids' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'multiple contexts with unique IDs merge correctly', async ( {
		page,
	} ) => {
		await page.getByTestId( 'show context' ).click();

		const contextResult = await parseContent(
			page.getByTestId( 'multiple contexts result' )
		);

		expect( contextResult ).toMatchObject( {
			prop1: 'context1',
			prop2: 'context2',
			prop3: 'context3',
			shared: 'from-second', // Last context wins
			nested: { value: 'deep' },
		} );
	} );

	test( 'multiple watchers with unique IDs execute independently', async ( {
		page,
	} ) => {
		// Initial state
		await expect( page.getByTestId( 'counter' ) ).toHaveText( '0' );
		await expect( page.getByTestId( 'watch1 count' ) ).toHaveText( '0' );
		await expect( page.getByTestId( 'watch2 count' ) ).toHaveText( '0' );

		// Increment counter - both watchers should fire
		await page.getByTestId( 'increment counter' ).click();

		await expect( page.getByTestId( 'counter' ) ).toHaveText( '1' );
		await expect( page.getByTestId( 'watch1 count' ) ).toHaveText( '1' );
		await expect( page.getByTestId( 'watch2 count' ) ).toHaveText( '1' );

		// Increment again
		await page.getByTestId( 'increment counter' ).click();

		await expect( page.getByTestId( 'counter' ) ).toHaveText( '2' );
		await expect( page.getByTestId( 'watch1 count' ) ).toHaveText( '2' );
		await expect( page.getByTestId( 'watch2 count' ) ).toHaveText( '2' );
	} );

	test( 'multiple init functions with unique IDs execute', async ( {
		page,
	} ) => {
		// All init functions should have been called
		await expect( page.getByTestId( 'init1 called' ) ).toHaveText( 'true' );
		await expect( page.getByTestId( 'init2 called' ) ).toHaveText( 'true' );
		await expect( page.getByTestId( 'init3 called' ) ).toHaveText( 'true' );
	} );

	test( 'multiple event handlers with unique IDs work correctly', async ( {
		page,
	} ) => {
		// Initial state
		await expect( page.getByTestId( 'click1 count' ) ).toHaveText( '0' );
		await expect( page.getByTestId( 'click2 count' ) ).toHaveText( '0' );

		// Click button - both handlers should execute
		await page.getByTestId( 'mixed click handler' ).click();

		await expect( page.getByTestId( 'click1 count' ) ).toHaveText( '1' );
		await expect( page.getByTestId( 'click2 count' ) ).toHaveText( '1' );
		await expect( page.getByTestId( 'mixed click handler' ) ).toHaveText(
			'2'
		);
	} );

	test( 'nested contexts with unique IDs merge properly', async ( {
		page,
	} ) => {
		await expect( page.getByTestId( 'parent level' ) ).toHaveText(
			'parent'
		);
		await expect( page.getByTestId( 'child level' ) ).toHaveText( 'child' );

		await page.getByTestId( 'show merged data' ).click();

		const mergedData = await parseContent(
			page.getByTestId( 'merged data' )
		);

		// All data objects should be merged
		expect( mergedData ).toMatchObject( {
			parent: true,
			plugin1: true,
			child: true,
			plugin2: true,
		} );
	} );

	test( 'unsupported directives with unique IDs show warnings', async ( {
		page,
	} ) => {
		// Capture console warnings
		const consoleWarnings: string[] = [];
		page.on( 'console', ( msg ) => {
			if ( msg.type() === 'warning' ) {
				consoleWarnings.push( msg.text() );
			}
		} );

		// Reload to trigger directive processing
		await page.reload();

		// Wait for page to be ready
		await page.locator( '[data-testid="unsupported style"]' ).waitFor();

		// Check that warnings were issued for unsupported directives
		expect(
			consoleWarnings.some( ( warning ) =>
				warning.includes(
					'Directive "style" does not support unique IDs'
				)
			)
		).toBe( true );

		expect(
			consoleWarnings.some( ( warning ) =>
				warning.includes(
					'Directive "class" does not support unique IDs'
				)
			)
		).toBe( true );

		expect(
			consoleWarnings.some( ( warning ) =>
				warning.includes(
					'Directive "text" does not support unique IDs'
				)
			)
		).toBe( true );

		expect(
			consoleWarnings.some( ( warning ) =>
				warning.includes(
					'Directive "bind" does not support unique IDs'
				)
			)
		).toBe( true );
	} );

	test( 'backward compatibility - directives without unique IDs still work', async ( {
		page,
	} ) => {
		// This is tested implicitly by the fact that regular directives (without unique IDs)
		// in the test fixture work correctly, but let's add an explicit test

		// The parent level context should still work (no unique ID)
		await expect( page.getByTestId( 'parent level' ) ).toHaveText(
			'parent'
		);

		// Regular click handlers should still work
		await page.getByTestId( 'increment counter' ).click();
		await expect( page.getByTestId( 'counter' ) ).toHaveText( '1' );
	} );

	test( 'unique IDs work with complex suffixes', async ( { page } ) => {
		// This test verifies that the regex correctly handles both suffixes and unique IDs
		// The mixed click handler uses both regular and unique ID variants

		await page.getByTestId( 'mixed click handler' ).click();

		// Both handlers should have executed
		await expect( page.getByTestId( 'click1 count' ) ).toHaveText( '1' );
		await expect( page.getByTestId( 'click2 count' ) ).toHaveText( '1' );
	} );
} );
