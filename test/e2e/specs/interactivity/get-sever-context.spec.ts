/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'getServerContext()', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		const parent = {
			prop: 'parent',
			nested: {
				prop: 'parent',
			},
			inherited: {
				prop: 'parent',
			},
		};

		const parentModified = {
			prop: 'parentModified',
			nested: {
				prop: 'parentModified',
			},
			inherited: {
				prop: 'parentModified',
			},
		};

		const parentNewProps = {
			prop: 'parent',
			newProp: 'parent',
			nested: {
				prop: 'parent',
				newProp: 'parent',
			},
			inherited: {
				prop: 'parent',
				newProp: 'parent',
			},
		};

		const child = {
			prop: 'child',
			nested: {
				prop: 'child',
			},
		};

		const childModified = {
			prop: 'childModified',
			nested: {
				prop: 'childModified',
			},
		};

		const childNewProps = {
			prop: 'child',
			newProp: 'child',
			nested: {
				prop: 'child',
				newProp: 'child',
			},
		};

		await utils.activatePlugins();
		const link1 = await utils.addPostWithBlock( 'test/get-server-context', {
			alias: 'getServerContext() - modified',
			attributes: {
				parentContext: parentModified,
				childContext: childModified,
			},
		} );
		const link2 = await utils.addPostWithBlock( 'test/get-server-context', {
			alias: 'getServerContext() - new props',
			attributes: {
				parentContext: parentNewProps,
				childContext: childNewProps,
			},
		} );
		await utils.addPostWithBlock( 'test/get-server-context', {
			alias: 'getServerContext() - main',
			attributes: {
				links: { modified: link1, newProps: link2 },
				parentContext: parent,
				childContext: child,
			},
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'getServerContext() - main' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should update modified props on navigation', async ( { page } ) => {
		const prop = page.getByTestId( 'prop' );
		const nestedProp = page.getByTestId( 'nested.prop' );
		const inheritedProp = page.getByTestId( 'inherited.prop' );

		await expect( prop ).toHaveText( 'child' );
		await expect( nestedProp ).toHaveText( 'child' );
		await expect( inheritedProp ).toHaveText( 'parent' );

		await page.getByTestId( 'modified' ).click();

		await expect( prop ).toHaveText( 'childModified' );
		await expect( nestedProp ).toHaveText( 'childModified' );
		await expect( inheritedProp ).toHaveText( 'parentModified' );

		await page.goBack();

		await expect( prop ).toHaveText( 'child' );
		await expect( nestedProp ).toHaveText( 'child' );
		await expect( inheritedProp ).toHaveText( 'parent' );
	} );

	test( 'should add new props on navigation', async ( { page } ) => {
		const newProp = page.getByTestId( 'newProp' );
		const nestedNewProp = page.getByTestId( 'nested.newProp' );
		const inheritedNewProp = page.getByTestId( 'inherited.newProp' );

		await expect( newProp ).toBeEmpty();
		await expect( nestedNewProp ).toBeEmpty();
		await expect( inheritedNewProp ).toBeEmpty();

		await page.getByTestId( 'newProps' ).click();

		await expect( newProp ).toHaveText( 'child' );
		await expect( nestedNewProp ).toHaveText( 'child' );
		await expect( inheritedNewProp ).toHaveText( 'parent' );
	} );

	test( 'should keep new props on navigation', async ( { page } ) => {
		const newProp = page.getByTestId( 'newProp' );
		const nestedNewProp = page.getByTestId( 'nested.newProp' );
		const inheritedNewProp = page.getByTestId( 'inherited.newProp' );

		await page.getByTestId( 'newProps' ).click();

		await expect( newProp ).toHaveText( 'child' );
		await expect( nestedNewProp ).toHaveText( 'child' );
		await expect( inheritedNewProp ).toHaveText( 'parent' );

		await page.goBack();

		await expect( newProp ).toHaveText( 'child' );
		await expect( nestedNewProp ).toHaveText( 'child' );
		await expect( inheritedNewProp ).toHaveText( 'parent' );
	} );

	test( 'should prevent any manual modifications', async ( { page } ) => {
		const prop = page.getByTestId( 'prop' );
		const button = page.getByTestId( 'tryToModifyServerContext' );

		await expect( prop ).toHaveText( 'child' );
		await expect( button ).toHaveText( 'modify' );

		await button.click();

		await expect( prop ).toHaveText( 'child' );
		await expect( button ).toHaveText( 'not modified ✅' );
	} );
} );
