const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { openPostSummary } = require( './post-summary/utils' );

// Set browser to a timezone that's different to `timezone`.
test.use( {
	timezoneId: 'America/New_York',
} );

// The `timezone` setting exposed via REST API only accepts `UTC`
// and timezone strings by location.
const TIMEZONES = [ 'Pacific/Honolulu', 'UTC', 'Australia/Sydney' ];

TIMEZONES.forEach( ( timezone ) => {
	test.describe( `Datepicker: ${ timezone }`, () => {
		let originalTimezone;

		test.beforeAll( async ( { requestUtils } ) => {
			originalTimezone = ( await requestUtils.getSiteSettings() )
				.timezone;
			await requestUtils.updateSiteSettings( { timezone } );
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost();
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.updateSiteSettings( {
				timezone: originalTimezone,
			} );
		} );

		test( 'should show the publishing date if the date is in the past', async ( {
			editor,
			page,
		} ) => {
			const summary = await openPostSummary( { editor, page } );
			await summary.getByRole( 'button', { name: 'Edit Date' } ).click();

			const lastYear = new Date().getFullYear() - 1;
			await page
				.getByLabel( 'Date time' )
				.fill( `${ lastYear }-03-15T10:00` );
			await page.keyboard.press( 'Escape' );

			// The row renders the date in the site timezone, so the wall time
			// entered above must come back unshifted regardless of the
			// browser timezone.
			await expect(
				summary.getByText( `Mar 15, ${ lastYear } 10:00 am` )
			).toBeVisible();
		} );

		test( 'should show the publishing date if the date is in the future', async ( {
			editor,
			page,
		} ) => {
			const summary = await openPostSummary( { editor, page } );
			await summary.getByRole( 'button', { name: 'Edit Date' } ).click();

			const nextYear = new Date().getFullYear() + 1;
			await page
				.getByLabel( 'Date time' )
				.fill( `${ nextYear }-03-15T10:00` );
			await page.keyboard.press( 'Escape' );

			await expect(
				summary.getByText( `Mar 15, ${ nextYear } 10:00 am` )
			).toBeVisible();
		} );
	} );
} );
