import { expect, test } from '@playwright/test';
import { gotoStoryId } from '../utils';

test.describe( 'Menu', () => {
	test.beforeEach( async ( { page } ) => {
		await gotoStoryId(
			page,
			'design-system-components-menu--non-modal-with-iframe'
		);
	} );

	test( 'one iframe click closes a non-modal menu and activates the target', async ( {
		page,
	} ) => {
		await page.getByRole( 'button', { name: 'Open menu' } ).click();
		await expect( page.getByRole( 'menu' ) ).toBeVisible();

		const canvasTarget = page
			.frameLocator( 'iframe[title="Editor canvas two"]' )
			.getByRole( 'button', { name: 'Canvas target two' } );
		await canvasTarget.evaluate( ( target ) => {
			target.addEventListener( 'click', () => {
				target.setAttribute( 'data-activated', 'true' );
			} );
		} );

		await canvasTarget.click();

		await expect( canvasTarget ).toHaveAttribute(
			'data-activated',
			'true'
		);
		await expect( canvasTarget ).toBeFocused();
		await expect( page.getByRole( 'menu' ) ).toBeHidden();
	} );

	test( 'one parent-document click closes a non-modal menu and activates the target', async ( {
		page,
	} ) => {
		await page.getByRole( 'button', { name: 'Open menu' } ).click();
		await expect( page.getByRole( 'menu' ) ).toBeVisible();

		const parentTarget = page.getByRole( 'button', {
			name: 'Parent target',
		} );
		await parentTarget.evaluate( ( target ) => {
			target.addEventListener( 'click', () => {
				target.setAttribute( 'data-activated', 'true' );
			} );
		} );

		await parentTarget.click();

		await expect( page.getByRole( 'menu' ) ).toBeHidden();
		await expect( parentTarget ).toHaveAttribute(
			'data-activated',
			'true'
		);
		await expect( parentTarget ).toBeFocused();
	} );

	test( 'Escape and arrow-key navigation keep their expected behavior', async ( {
		page,
	} ) => {
		const trigger = page.getByRole( 'button', { name: 'Open menu' } );
		await trigger.focus();
		await page.keyboard.press( 'Enter' );

		const firstItem = page.getByRole( 'menuitem', {
			name: 'First action',
		} );
		const secondItem = page.getByRole( 'menuitem', {
			name: 'Second action',
		} );
		await expect( firstItem ).toBeFocused();

		await page.keyboard.press( 'ArrowDown' );
		await expect( secondItem ).toBeFocused();

		await page.keyboard.press( 'Escape' );
		await expect( page.getByRole( 'menu' ) ).toBeHidden();
		await expect( trigger ).toBeFocused();
	} );
} );
