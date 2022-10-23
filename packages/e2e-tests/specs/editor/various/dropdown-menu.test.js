/**
 * WordPress dependencies
 */
import { createNewPost, pressKeyTimes } from '@wordpress/e2e-test-utils';

const moreMenuButtonSelector = '.components-button[aria-label="Options"]';
const moreMenuDropdownSelector =
	'.components-dropdown-menu__menu[aria-label="Options"]';
const menuItemsSelector = [ 'menuitem', 'menuitemcheckbox', 'menuitemradio' ]
	.map( ( role ) => `${ moreMenuDropdownSelector } [role="${ role }"]` )
	.join( ',' );

describe( 'Dropdown Menu', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'allows navigation through each item using arrow keys', async () => {
		await page.click( moreMenuButtonSelector );
		const menuItems = await page.$$( menuItemsSelector );

		// Catch any issues with the selector, which could cause a false positive test result.
		expect( menuItems.length ).toBeGreaterThan( 0 );

		let activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);
		const [ firstMenuItem ] = menuItems;
		const firstMenuItemText = await firstMenuItem.evaluate(
			( element ) => element.textContent
		);

		// Expect the first menu item to be focused.
		expect( activeElementText ).toBeDefined();
		expect( activeElementText ).toBe( firstMenuItemText );

		// Arrow down to the last item.
		await pressKeyTimes( 'ArrowDown', menuItems.length - 1 );

		activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);

		const [ lastMenuItem ] = menuItems.slice( -1 );
		const lastMenuItemText = await lastMenuItem.evaluate(
			( element ) => element.textContent
		);

		// Expect the last menu item to be focused.
		expect( activeElementText ).toBeDefined();
		expect( activeElementText ).toBe( lastMenuItemText );

		// Arrow back up to the first item.
		await pressKeyTimes( 'ArrowUp', menuItems.length - 1 );

		activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);

		// Expect the first menu item to be focused again.
		expect( activeElementText ).toBeDefined();
		expect( activeElementText ).toBe( firstMenuItemText );
	} );

	it( 'loops to the beginning and end when navigating past the boundaries of the menu', async () => {
		await page.click( moreMenuButtonSelector );
		const menuItems = await page.$$( menuItemsSelector );

		// Catch any issues with the selector, which could cause a false positive test result.
		expect( menuItems.length ).toBeGreaterThan( 0 );

		let activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);
		const [ firstMenuItem ] = menuItems;
		const firstMenuItemText = await firstMenuItem.evaluate(
			( element ) => element.textContent
		);

		// Expect the first menu item to be focused.
		expect( activeElementText ).toBeDefined();
		expect( activeElementText ).toBe( firstMenuItemText );

		// Arrow up to the last item.
		await page.keyboard.press( 'ArrowUp' );

		activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);

		const [ lastMenuItem ] = menuItems.slice( -1 );
		const lastMenuItemText = await lastMenuItem.evaluate(
			( element ) => element.textContent
		);

		// Expect the last menu item to be focused.
		expect( activeElementText ).toBeDefined();
		expect( activeElementText ).toBe( lastMenuItemText );

		// Arrow back down to the first item.
		await page.keyboard.press( 'ArrowDown' );

		activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);

		// Expect the first menu item to be focused again.
		expect( activeElementText ).toBeDefined();
		expect( activeElementText ).toBe( firstMenuItemText );
	} );

	it( 'ignores arrow key navigation that is orthogonal to the orientation of the menu, but stays open', async () => {
		await page.click( moreMenuButtonSelector );
		const menuItems = await page.$$( menuItemsSelector );

		// Catch any issues with the selector, which could cause a false positive test result.
		expect( menuItems.length ).toBeGreaterThan( 0 );

		let activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);
		const [ firstMenuItem ] = menuItems;
		const firstMenuItemText = await firstMenuItem.evaluate(
			( element ) => element.textContent
		);

		// Expect the first menu item to be focused.
		expect( activeElementText ).toBeDefined();
		expect( activeElementText ).toBe( firstMenuItemText );

		// Press left and right keys an arbitrary (but > 1) number of times.
		await pressKeyTimes( 'ArrowLeft', 5 );
		await pressKeyTimes( 'ArrowRight', 5 );

		activeElementText = await page.evaluate(
			() => document.activeElement.textContent
		);

		// Expect the first menu item to still be focused.
		expect( activeElementText ).toBeDefined();
		expect( activeElementText ).toBe( firstMenuItemText );
	} );
} );
