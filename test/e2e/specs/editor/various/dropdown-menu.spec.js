/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Dropdown Menu', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'keyboard navigiation', async ( { page, pageUtils } ) => {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		const menuItems = page
			.getByRole( 'menu', { name: 'Options' } )
			.locator(
				'[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
			);
		const totalItems = await menuItems.count();

		// Catch any issues with the selector, which could cause a false positive test result.
		expect( totalItems ).toBeGreaterThan( 0 );

		await test.step( 'allows navigation through each item using arrow keys', async () => {
			// Expect the first menu item to be focused.
			await expect( menuItems.first() ).toBeFocused();

			// Arrow down to the last item.
			await pageUtils.pressKeys( 'ArrowDown', { times: totalItems - 1 } );
			await expect( menuItems.last() ).toBeFocused();

			// Arrow back up to the first item.
			await pageUtils.pressKeys( 'ArrowUp', { times: totalItems - 1 } );
			await expect( menuItems.first() ).toBeFocused();
		} );

		await test.step( 'loops to the beginning and end when navigating past the boundaries of the menu', async () => {
			// Expect the first menu item to be focused.
			await expect( menuItems.first() ).toBeFocused();

			// Arrow up to the last item.
			await page.keyboard.press( 'ArrowUp' );
			await expect( menuItems.last() ).toBeFocused();

			// Arrow back down to the first item.
			await page.keyboard.press( 'ArrowDown' );
			await expect( menuItems.first() ).toBeFocused();
		} );

		await test.step( 'ignores arrow key navigation that is orthogonal to the orientation of the menu, but stays open', async () => {
			// Expect the first menu item to be focused.
			await expect( menuItems.first() ).toBeFocused();

			// Press left and right keys an arbitrary (but > 1) number of times.
			await pageUtils.pressKeys( 'ArrowLeft', { times: 5 } );
			await pageUtils.pressKeys( 'ArrowRight', { times: 5 } );

			// Expect the first menu item to still be focused.
			await expect( menuItems.first() ).toBeFocused();
		} );
	} );
} );
