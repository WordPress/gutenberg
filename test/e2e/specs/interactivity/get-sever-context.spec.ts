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
		const parentProp = page.getByTestId( 'parent.prop' );
		const parentNestedProp = page.getByTestId( 'parent.nested.prop' );
		const parentInheritedProp = page.getByTestId( 'parent.inherited.prop' );
		const childProp = page.getByTestId( 'child.prop' );
		const childNestedProp = page.getByTestId( 'child.nested.prop' );
		const childInheritedProp = page.getByTestId( 'child.inherited.prop' );

		await expect( parentProp ).toHaveText( 'parent' );
		await expect( parentNestedProp ).toHaveText( 'parent' );
		await expect( parentInheritedProp ).toHaveText( 'parent' );
		await expect( childProp ).toHaveText( 'child' );
		await expect( childNestedProp ).toHaveText( 'child' );
		await expect( childInheritedProp ).toHaveText( 'parent' );

		await page.getByTestId( 'modified' ).click();

		await expect( parentProp ).toHaveText( 'parentModified' );
		await expect( parentNestedProp ).toHaveText( 'parentModified' );
		await expect( parentInheritedProp ).toHaveText( 'parentModified' );
		await expect( childProp ).toHaveText( 'childModified' );
		await expect( childNestedProp ).toHaveText( 'childModified' );
		await expect( childInheritedProp ).toHaveText( 'parentModified' );

		await page.goBack();

		await expect( parentProp ).toHaveText( 'parent' );
		await expect( parentNestedProp ).toHaveText( 'parent' );
		await expect( parentInheritedProp ).toHaveText( 'parent' );
		await expect( childProp ).toHaveText( 'child' );
		await expect( childNestedProp ).toHaveText( 'child' );
		await expect( childInheritedProp ).toHaveText( 'parent' );
	} );

	test( 'should add new props on navigation', async ( { page } ) => {
		const parentProp = page.getByTestId( 'parent.newProp' );
		const parentNestedProp = page.getByTestId( 'parent.nested.newProp' );
		const parentInheritedProp = page.getByTestId(
			'parent.inherited.newProp'
		);
		const childProp = page.getByTestId( 'child.newProp' );
		const childNestedProp = page.getByTestId( 'child.nested.newProp' );
		const childInheritedProp = page.getByTestId(
			'child.inherited.newProp'
		);

		await expect( parentProp ).toBeEmpty();
		await expect( parentNestedProp ).toBeEmpty();
		await expect( parentInheritedProp ).toBeEmpty();
		await expect( childProp ).toBeEmpty();
		await expect( childNestedProp ).toBeEmpty();
		await expect( childInheritedProp ).toBeEmpty();

		await page.getByTestId( 'newProps' ).click();

		await expect( parentProp ).toHaveText( 'parent' );
		await expect( parentNestedProp ).toHaveText( 'parent' );
		await expect( parentInheritedProp ).toHaveText( 'parent' );
		await expect( childProp ).toHaveText( 'child' );
		await expect( childNestedProp ).toHaveText( 'child' );
		await expect( childInheritedProp ).toHaveText( 'parent' );
	} );

	test( 'should keep new props on navigation', async ( { page } ) => {
		const parentProp = page.getByTestId( 'parent.newProp' );
		const parentNestedProp = page.getByTestId( 'parent.nested.newProp' );
		const parentInheritedProp = page.getByTestId(
			'parent.inherited.newProp'
		);
		const childProp = page.getByTestId( 'child.newProp' );
		const childNestedProp = page.getByTestId( 'child.nested.newProp' );
		const childInheritedProp = page.getByTestId(
			'child.inherited.newProp'
		);

		await page.getByTestId( 'newProps' ).click();

		await expect( parentProp ).toHaveText( 'parent' );
		await expect( parentNestedProp ).toHaveText( 'parent' );
		await expect( parentInheritedProp ).toHaveText( 'parent' );
		await expect( childProp ).toHaveText( 'child' );
		await expect( childNestedProp ).toHaveText( 'child' );
		await expect( childInheritedProp ).toHaveText( 'parent' );

		await page.goBack();

		await expect( parentProp ).toHaveText( 'parent' );
		await expect( parentNestedProp ).toHaveText( 'parent' );
		await expect( parentInheritedProp ).toHaveText( 'parent' );
		await expect( childProp ).toHaveText( 'child' );
		await expect( childNestedProp ).toHaveText( 'child' );
		await expect( childInheritedProp ).toHaveText( 'parent' );
	} );
} );
