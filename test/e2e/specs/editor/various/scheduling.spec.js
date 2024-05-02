/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// The `timezone` setting exposed via REST API only accepts `UTC`
// and timezone strings by location.
const TIMEZONES = [ 'Pacific/Honolulu', 'UTC', 'Australia/Sydney' ];

test.describe( 'Scheduling', () => {
	TIMEZONES.forEach( ( timezone ) => {
		test.describe( `Timezone ${ timezone }`, () => {
			let orignalTimezone;
			test.beforeAll( async ( { requestUtils } ) => {
				orignalTimezone = ( await requestUtils.getSiteSettings() )
					.timezone;

				await requestUtils.updateSiteSettings( { timezone } );
			} );

			test.afterAll( async ( { requestUtils } ) => {
				await requestUtils.updateSiteSettings( {
					timezone: orignalTimezone,
				} );
			} );

			test( 'Should change publishing button text from "Publish" to "Schedule"', async ( {
				admin,
				editor,
				page,
			} ) => {
				await admin.createNewPost();
				await editor.openDocumentSettingsSidebar();

				const topBar = page.getByRole( 'region', {
					name: 'Editor top bar',
				} );

				await expect(
					topBar.getByRole( 'button', { name: 'Publish' } )
				).toBeVisible();

				// Open the datepicker.
				await page
					.getByRole( 'button', { name: 'Change date' } )
					.click();

				// Change the publishing date to a year in the future.
				await page
					.getByRole( 'group', { name: 'Date' } )
					.getByRole( 'spinbutton', { name: 'Year' } )
					.click();
				await page.keyboard.press( 'ArrowUp' );

				// Close the datepicker.
				await page.keyboard.press( 'Escape' );

				await expect(
					topBar.getByRole( 'button', { name: 'Schedule' } )
				).toBeVisible();
			} );
		} );
	} );

	test( 'should keep date time UI focused when the previous and next month buttons are clicked', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'button', { name: 'Change date' } ).click();

		const calendar = page.getByRole( 'application', { name: 'Calendar' } );
		const prevMonth = calendar.getByRole( 'button', {
			name: 'View previous month',
		} );
		const nextMonth = calendar.getByRole( 'button', {
			name: 'View next month',
		} );

		await prevMonth.click();
		await expect( prevMonth ).toBeFocused();
		await expect( calendar ).toBeVisible();

		await nextMonth.click();
		await expect( nextMonth ).toBeFocused();
		await expect( calendar ).toBeVisible();
	} );
} );
