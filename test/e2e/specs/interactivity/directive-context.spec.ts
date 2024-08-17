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

test.describe( 'data-wp-context', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-context' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-context' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'is correctly initialized', async ( { page } ) => {
		const parentContext = await parseContent(
			page.getByTestId( 'parent context' )
		);

		expect( parentContext ).toMatchObject( {
			prop1: 'parent',
			prop2: 'parent',
			obj: { prop4: 'parent', prop5: 'parent' },
			array: [ 1, 2, 3 ],
		} );
	} );

	test( 'is correctly extended (shallow)', async ( { page } ) => {
		const childContext = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( childContext ).toMatchObject( {
			prop1: 'parent',
			prop2: 'child',
			prop3: 'child',
			obj: { prop5: 'child', prop6: 'child' },
			array: [ 4, 5, 6 ],
		} );
	} );

	test( "changes in inherited properties are reflected and don't leak down (child)", async ( {
		page,
	} ) => {
		await page.getByTestId( 'child prop1' ).click();
		await page.getByTestId( 'child obj.prop4' ).click();

		const childContext = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( childContext.prop1 ).toBe( 'modifiedFromChild' );
		expect( childContext.obj.prop4 ).toBe( 'modifiedFromChild' );

		const parentContext = await parseContent(
			page.getByTestId( 'parent context' )
		);

		expect( parentContext.prop1 ).toBe( 'modifiedFromChild' );
		expect( parentContext.obj.prop4 ).toBe( 'parent' );
	} );

	test( "changes in inherited properties are reflected and don't leak up (parent)", async ( {
		page,
	} ) => {
		await page.getByTestId( 'parent prop1' ).click();
		await page.getByTestId( 'parent obj.prop4' ).click();

		const childContext = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( childContext.prop1 ).toBe( 'modifiedFromParent' );
		expect( childContext.obj.prop4 ).toBeUndefined();

		const parentContext = await parseContent(
			page.getByTestId( 'parent context' )
		);

		expect( parentContext.prop1 ).toBe( 'modifiedFromParent' );
		expect( parentContext.obj.prop4 ).toBe( 'modifiedFromParent' );
	} );

	test( 'changes in shadowed properties do not leak (child)', async ( {
		page,
	} ) => {
		await page.getByTestId( 'child prop2' ).click();
		await page.getByTestId( 'child obj.prop5' ).click();

		const childContext = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( childContext.prop2 ).toBe( 'modifiedFromChild' );
		expect( childContext.obj.prop5 ).toBe( 'modifiedFromChild' );

		const parentContext = await parseContent(
			page.getByTestId( 'parent context' )
		);

		expect( parentContext.prop2 ).toBe( 'parent' );
		expect( parentContext.obj.prop5 ).toBe( 'parent' );
	} );

	test( 'changes in shadowed properties do not leak (parent)', async ( {
		page,
	} ) => {
		await page.getByTestId( 'parent prop2' ).click();
		await page.getByTestId( 'parent obj.prop5' ).click();

		const childContext = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( childContext.prop2 ).toBe( 'child' );
		expect( childContext.obj.prop5 ).toBe( 'child' );

		const parentContext = await parseContent(
			page.getByTestId( 'parent context' )
		);

		expect( parentContext.prop2 ).toBe( 'modifiedFromParent' );
		expect( parentContext.obj.prop5 ).toBe( 'modifiedFromParent' );
	} );

	test( 'new inherited properties update child contexts', async ( {
		page,
	} ) => {
		const childContextBefore = await parseContent(
			page.getByTestId( 'child context' )
		);
		expect( childContextBefore.new ).toBeUndefined();

		await page.getByTestId( 'parent new' ).click();

		const childContextAfter = await parseContent(
			page.getByTestId( 'child context' )
		);
		expect( childContextAfter.new ).toBe( 'modifiedFromParent' );

		const parentContext = await parseContent(
			page.getByTestId( 'parent context' )
		);
		expect( parentContext.new ).toBe( 'modifiedFromParent' );
	} );

	test( 'Array properties are shadowed', async ( { page } ) => {
		const parentContext = await parseContent(
			page.getByTestId( 'parent context' )
		);

		const childContext = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( parentContext.array ).toMatchObject( [ 1, 2, 3 ] );
		expect( childContext.array ).toMatchObject( [ 4, 5, 6 ] );
	} );

	test( "overwritten objects don't inherit values (shallow)", async ( {
		page,
	} ) => {
		await page.getByTestId( 'parent replace' ).click();

		const childContext = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( childContext.obj.prop4 ).toBeUndefined();
		expect( childContext.obj.prop5 ).toBe( 'child' );
		expect( childContext.obj.prop6 ).toBe( 'child' );
		expect( childContext.obj.overwritten ).toBeUndefined();

		const parentContext = await parseContent(
			page.getByTestId( 'parent context' )
		);

		expect( parentContext.obj.prop4 ).toBeUndefined();
		expect( parentContext.obj.prop5 ).toBeUndefined();
		expect( parentContext.obj.prop6 ).toBeUndefined();
		expect( parentContext.obj.overwritten ).toBe( true );
	} );

	test( 'overwritten objects do not inherit values', async ( { page } ) => {
		await page.getByTestId( 'child replace' ).click();

		const childContext = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( childContext.obj.prop4 ).toBeUndefined();
		expect( childContext.obj.prop5 ).toBeUndefined();
		expect( childContext.obj.prop6 ).toBeUndefined();
		expect( childContext.obj.overwritten ).toBe( true );

		const parentContext = await parseContent(
			page.getByTestId( 'parent context' )
		);

		expect( parentContext.obj.prop4 ).toBe( 'parent' );
		expect( parentContext.obj.prop5 ).toBe( 'parent' );
		expect( parentContext.obj.prop6 ).toBeUndefined();
		expect( parentContext.obj.overwritten ).toBeUndefined();
	} );

	test( 'can be accessed in other directives on the same element', async ( {
		page,
	} ) => {
		const element = page.getByTestId( 'context & other directives' );
		await expect( element ).toHaveText( 'Text 1' );
		await expect( element ).toHaveAttribute( 'value', 'Text 1' );
		await element.click();
		await expect( element ).toHaveText( 'Text 2' );
		await expect( element ).toHaveAttribute( 'value', 'Text 2' );
		await element.click();
		await expect( element ).toHaveText( 'Text 1' );
		await expect( element ).toHaveAttribute( 'value', 'Text 1' );
	} );

	test( 'should preserve values on navigation', async ( { page } ) => {
		const element = page.getByTestId( 'navigation text' );
		await expect( element ).toHaveText( 'first page' );
		await page.getByTestId( 'toggle text' ).click();
		await expect( element ).toHaveText( 'changed dynamically' );
		await page.getByTestId( 'navigate' ).click();
		await expect( element ).toHaveText( 'changed dynamically' );
	} );

	test( 'should preserve the previous context values', async ( { page } ) => {
		const element = page.getByTestId( 'navigation new text' );
		await expect( element ).toHaveText( '' );
		await page.getByTestId( 'add new text' ).click();
		await expect( element ).toHaveText( 'some new text' );
		await page.getByTestId( 'navigate' ).click();
		await expect( element ).toHaveText( 'some new text' );
	} );

	test( 'should preserve values when navigating back or forward', async ( {
		page,
	} ) => {
		const element = page.getByTestId( 'navigation text' );
		await page.getByTestId( 'navigate' ).click();
		await expect( element ).toHaveText( 'first page' );
		await page.goBack();
		await expect( element ).toHaveText( 'first page' );
		await page.goForward();
		await expect( element ).toHaveText( 'first page' );
	} );

	test( 'should inherit values on navigation', async ( { page } ) => {
		const text = page.getByTestId( 'navigation inherited text' );
		const text2 = page.getByTestId( 'navigation inherited text2' );
		await expect( text ).toHaveText( 'first page' );
		await expect( text2 ).toBeEmpty();
		await page.getByTestId( 'toggle text' ).click();
		await expect( text ).toHaveText( 'changed dynamically' );
		await page.getByTestId( 'add text2' ).click();
		await expect( text2 ).toHaveText( 'some new text' );
		await page.getByTestId( 'navigate' ).click();
		await expect( text ).toHaveText( 'changed dynamically' );
		await expect( text2 ).toHaveText( 'some new text' );
		await page.goBack();
		await expect( text ).toHaveText( 'changed dynamically' );
		await expect( text2 ).toHaveText( 'some new text' );
		await page.goForward();
		await expect( text ).toHaveText( 'changed dynamically' );
		await expect( text2 ).toHaveText( 'some new text' );
	} );

	test( 'should maintain the same context reference on async actions', async ( {
		page,
	} ) => {
		const element = page.getByTestId( 'navigation new text' );
		await expect( element ).toHaveText( '' );
		await page.getByTestId( 'async navigate' ).click();
		await expect( element ).toHaveText( 'changed from async action' );
	} );

	test( 'should bail out if the context is not a default directive', async ( {
		page,
	} ) => {
		/*
		 * This test is to ensure that the context directive is only applied to the
		 * default directive and not to any other directive.
		 */
		const defaultElement = page.getByTestId( 'default suffix context' );
		await expect( defaultElement ).toHaveText( 'default' );
		const element = page.getByTestId( 'non-default suffix context' );
		await expect( element ).toHaveText( '' );
	} );

	test( 'references to objects are kept', async ( { page } ) => {
		const selected = page.getByTestId( 'selected' );
		const select1 = page.getByTestId( 'select 1' );
		const select2 = page.getByTestId( 'select 2' );

		await expect( selected ).toBeEmpty();

		await select1.click();
		await expect( selected ).toHaveText( 'Text 1' );

		await select2.click();
		await expect( selected ).toHaveText( 'Text 2' );
	} );

	test( 'should not subscribe to parent context props if those also exist in child', async ( {
		page,
	} ) => {
		const counterParent = page.getByTestId( 'counter parent' );
		const counterChild = page.getByTestId( 'counter child' );
		const changes = page.getByTestId( 'counter changes' );

		await expect( counterParent ).toHaveText( '0' );
		await expect( counterChild ).toHaveText( '0' );
		// The first render counts, so the changes counter starts at 1.
		await expect( changes ).toHaveText( '1' );

		await counterParent.click();
		await expect( counterParent ).toHaveText( '1' );
		await expect( counterChild ).toHaveText( '0' );
		await expect( changes ).toHaveText( '1' );

		await counterChild.click();
		await expect( counterParent ).toHaveText( '1' );
		await expect( counterChild ).toHaveText( '1' );
		await expect( changes ).toHaveText( '2' );
	} );

	test( 'references to the same context object should be preserved', async ( {
		page,
	} ) => {
		const isProxyPreserved = page.getByTestId( 'is proxy preserved' );
		await expect( isProxyPreserved ).toHaveText( 'true' );
	} );

	test( 'references to copied context objects should be preserved', async ( {
		page,
	} ) => {
		await page.getByTestId( 'child copy obj' ).click();
		const isProxyPreservedOnCopy = page.getByTestId(
			'is proxy preserved on copy'
		);
		await expect( isProxyPreservedOnCopy ).toHaveText( 'true' );
	} );

	test( 'objects referenced from the context inherit properties where they are originally defined ', async ( {
		page,
	} ) => {
		await page.getByTestId( 'child copy obj' ).click();

		const childContextBefore = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( childContextBefore.obj2.prop4 ).toBeUndefined();
		expect( childContextBefore.obj2.prop5 ).toBe( 'child' );
		expect( childContextBefore.obj2.prop6 ).toBe( 'child' );

		await page.getByTestId( 'parent replace' ).click();

		const childContextAfter = await parseContent(
			page.getByTestId( 'child context' )
		);

		expect( childContextAfter.obj2.prop4 ).toBeUndefined();
		expect( childContextAfter.obj2.prop5 ).toBe( 'child' );
		expect( childContextAfter.obj2.prop6 ).toBe( 'child' );
		expect( childContextAfter.obj2.overwritten ).toBeUndefined();
	} );
} );
