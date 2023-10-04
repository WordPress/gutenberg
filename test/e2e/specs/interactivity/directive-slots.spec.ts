/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-slot', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-slots' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-slots' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should render the fill in its children by default', async ( {
		page,
	} ) => {
		const slot1 = page.getByTestId( 'slot-1' );
		const slots = page.getByTestId( 'slots' );
		const fillContainer = page.getByTestId( 'fill-container' );

		await page.getByTestId( 'slot-1-button' ).click();

		await expect( fillContainer ).toBeEmpty();
		await expect( slot1.getByTestId( 'fill' ) ).toBeVisible();
		await expect( slot1 ).toHaveText( 'fill inside slot 1' );
		await expect( slots.locator( 'css= > *' ) ).toHaveText( [
			'fill inside slot 1',
			'[2]',
			'[3]',
			'[4]',
			'[5]',
		] );
	} );

	test( 'should render the fill before if specified', async ( { page } ) => {
		const slot2 = page.getByTestId( 'slot-2' );
		const slots = page.getByTestId( 'slots' );
		const fillContainer = page.getByTestId( 'fill-container' );

		await page.getByTestId( 'slot-2-button' ).click();

		await expect( fillContainer ).toBeEmpty();
		await expect( slot2 ).toHaveText( '[2]' );
		await expect( slots.getByTestId( 'fill' ) ).toBeVisible();
		await expect( slots.locator( 'css= > *' ) ).toHaveText( [
			'[1]',
			'fill inside slots',
			'[2]',
			'[3]',
			'[4]',
			'[5]',
		] );
	} );

	test( 'should render the fill after if specified', async ( { page } ) => {
		const slot3 = page.getByTestId( 'slot-3' );
		const slots = page.getByTestId( 'slots' );
		const fillContainer = page.getByTestId( 'fill-container' );

		await page.getByTestId( 'slot-3-button' ).click();

		await expect( fillContainer ).toBeEmpty();
		await expect( slot3 ).toHaveText( '[3]' );
		await expect( slots.getByTestId( 'fill' ) ).toBeVisible();
		await expect( slots.locator( 'css= > *' ) ).toHaveText( [
			'[1]',
			'[2]',
			'[3]',
			'fill inside slots',
			'[4]',
			'[5]',
		] );
	} );

	test( 'should render the fill in its children if specified', async ( {
		page,
	} ) => {
		const slot4 = page.getByTestId( 'slot-4' );
		const slots = page.getByTestId( 'slots' );
		const fillContainer = page.getByTestId( 'fill-container' );

		await page.getByTestId( 'slot-4-button' ).click();

		await expect( fillContainer ).toBeEmpty();
		await expect( slot4.getByTestId( 'fill' ) ).toBeVisible();
		await expect( slot4 ).toHaveText( 'fill inside slot 4' );
		await expect( slots.locator( 'css= > *' ) ).toHaveText( [
			'[1]',
			'[2]',
			'[3]',
			'fill inside slot 4',
			'[5]',
		] );
	} );

	test( 'should be replaced by the fill if specified', async ( { page } ) => {
		const slot5 = page.getByTestId( 'slot-5' );
		const slots = page.getByTestId( 'slots' );
		const fillContainer = page.getByTestId( 'fill-container' );

		await page.getByTestId( 'slot-5-button' ).click();

		await expect( fillContainer ).toBeEmpty();
		await expect( slot5 ).not.toBeVisible();
		await expect( slots.getByTestId( 'fill' ) ).toBeVisible();
		await expect( slots.locator( 'css= > *' ) ).toHaveText( [
			'[1]',
			'[2]',
			'[3]',
			'[4]',
			'fill inside slots',
		] );
	} );

	test( 'should keep the fill in its original position if no slot matches', async ( {
		page,
	} ) => {
		const fillContainer = page.getByTestId( 'fill-container' );
		await expect( fillContainer.getByTestId( 'fill' ) ).toBeVisible();

		await page.getByTestId( 'slot-1-button' ).click();

		await expect( fillContainer ).toBeEmpty();

		await page.getByTestId( 'reset' ).click();

		await expect( fillContainer.getByTestId( 'fill' ) ).toBeVisible();
	} );

	test( 'should not be re-mounted when adding the fill before', async ( {
		page,
	} ) => {
		const slot2 = page.getByTestId( 'slot-2' );
		const slots = page.getByTestId( 'slots' );

		await expect( slot2 ).toHaveText( '[2]' );

		await slot2.click();

		await expect( slot2 ).toHaveText( '[2 updated]' );

		await page.getByTestId( 'slot-2-button' ).click();

		await expect( slots.getByTestId( 'fill' ) ).toBeVisible();
		await expect( slots.locator( 'css= > *' ) ).toHaveText( [
			'[1]',
			'fill inside slots',
			'[2 updated]',
			'[3]',
			'[4]',
			'[5]',
		] );
	} );

	test( 'should not be re-mounted when adding the fill after', async ( {
		page,
	} ) => {
		const slot3 = page.getByTestId( 'slot-3' );
		const slots = page.getByTestId( 'slots' );

		await expect( slot3 ).toHaveText( '[3]' );

		await slot3.click();

		await expect( slot3 ).toHaveText( '[3 updated]' );

		await page.getByTestId( 'slot-3-button' ).click();

		await expect( slots.getByTestId( 'fill' ) ).toBeVisible();
		await expect( slots.locator( 'css= > *' ) ).toHaveText( [
			'[1]',
			'[2]',
			'[3 updated]',
			'fill inside slots',
			'[4]',
			'[5]',
		] );
	} );
} );
