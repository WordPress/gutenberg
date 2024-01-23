/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Set browser to a timezone that's different to `timezone`.
test.use( {
	timezoneId: 'America/New_York',
} );

// The `timezone` setting exposed via REST API only accepts `UTC`
// and timezone strings by location.
const TIMEZONES = [ 'Pacific/Honolulu', 'UTC', 'Australia/Sydney' ];

TIMEZONES.forEach( ( timezone ) => {
	test.describe( `Datepicker: ${ timezone }`, () => {
		let orignalTimezone;
		test.beforeAll( async ( { requestUtils } ) => {
			orignalTimezone = ( await requestUtils.getSiteSettings() ).timezone;
			await requestUtils.updateSiteSettings( { timezone } );
		} );

		test.beforeEach( async ( { admin, editor } ) => {
			await admin.createNewPost();
			await editor.openDocumentSettingsSidebar();
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.updateSiteSettings( {
				timezone: orignalTimezone,
			} );
		} );

		test( 'should show the publishing date as "Immediately" if the date is not altered', async ( {
			page,
		} ) => {
			await expect(
				page.getByRole( 'button', { name: 'Change date' } )
			).toHaveText( 'Immediately' );
		} );

		test( 'should show the publishing date if the date is in the past', async ( {
			page,
		} ) => {
			const datepicker = page.getByRole( 'button', {
				name: 'Change date',
			} );
			await datepicker.click();

			// Change the publishing date to a year in the future.
			await page
				.getByRole( 'group', { name: 'Date' } )
				.getByRole( 'spinbutton', { name: 'Year' } )
				.click();
			await page.keyboard.press( 'ArrowDown' );
			await page.keyboard.press( 'Escape' );

			// The expected date format will be "Sep 26, 2018 11:52 pm".
			await expect(
				page.getByRole( 'button', { name: 'Change date' } )
			).toContainText( /^[A-Za-z]+\s\d{1,2},\s\d{1,4}/ );
		} );

		test( 'should show the publishing date if the date is in the future', async ( {
			page,
		} ) => {
			const datepicker = page.getByRole( 'button', {
				name: 'Change date',
			} );
			await datepicker.click();

			// Change the publishing date to a year in the future.
			await page
				.getByRole( 'group', { name: 'Date' } )
				.getByRole( 'spinbutton', { name: 'Year' } )
				.click();
			await page.keyboard.press( 'ArrowUp' );
			await page.keyboard.press( 'Escape' );

			// The expected date format will be "Sep 26, 2018 11:52 pm".
			await expect(
				page.getByRole( 'button', { name: 'Change date' } )
			).toContainText( /^[A-Za-z]+\s\d{1,2},\s\d{1,4}/ );
		} );

		test( 'should show the publishing date as "Immediately" if the date is cleared', async ( {
			page,
		} ) => {
			const datepicker = page.getByRole( 'button', {
				name: 'Change date',
			} );
			await datepicker.click();

			// Change the publishing date to a year in the future.
			await page
				.getByRole( 'group', { name: 'Date' } )
				.getByRole( 'spinbutton', { name: 'Year' } )
				.click();
			await page.keyboard.press( 'ArrowUp' );
			await page.keyboard.press( 'Escape' );

			// Clear the date.
			await datepicker.click();
			await page
				.getByLabel( 'Change publish date' )
				.getByRole( 'button', { name: 'Now' } )
				.click();

			await expect(
				page.getByRole( 'button', { name: 'Change date' } )
			).toHaveText( 'Immediately' );
		} );
	} );
} );
