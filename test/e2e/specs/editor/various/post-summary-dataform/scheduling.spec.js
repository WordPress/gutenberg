const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, openPostSummary } = require( './utils' );

// The `timezone` setting exposed via REST API only accepts `UTC`
// and timezone strings by location.
const TIMEZONES = [ 'Pacific/Honolulu', 'UTC', 'Australia/Sydney' ];

/*
 * Mirrors `test/e2e/specs/editor/various/scheduling.spec.js` with the DataForm
 * inspector experiment enabled; delete that spec when the experiment graduates.
 */
test.describe( 'Scheduling (DataForm inspector)', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	TIMEZONES.forEach( ( timezone ) => {
		test.describe( `Timezone ${ timezone }`, () => {
			let originalTimezone;

			test.beforeAll( async ( { requestUtils } ) => {
				originalTimezone = ( await requestUtils.getSiteSettings() )
					.timezone;

				await requestUtils.updateSiteSettings( { timezone } );
			} );

			test.afterAll( async ( { requestUtils } ) => {
				await requestUtils.updateSiteSettings( {
					timezone: originalTimezone,
				} );
			} );

			test( 'Should change publishing button text from "Publish" to "Schedule"', async ( {
				admin,
				editor,
				page,
			} ) => {
				await admin.createNewPost();
				const summary = await openPostSummary( { editor, page } );

				const topBar = page.getByRole( 'region', {
					name: 'Editor top bar',
				} );

				await expect(
					topBar.getByRole( 'button', { name: 'Publish' } )
				).toBeVisible();

				// Change the publishing date to a year in the future.
				await summary
					.getByRole( 'button', { name: 'Edit Date' } )
					.click();
				const nextYear = new Date().getFullYear() + 1;
				await page
					.getByLabel( 'Date time' )
					.fill( `${ nextYear }-03-15T10:00` );

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
		const summary = await openPostSummary( { editor, page } );
		await summary.getByRole( 'button', { name: 'Edit Date' } ).click();

		const calendar = page.getByRole( 'application', {
			name: /Date calendar/,
		} );
		const prevMonth = calendar.getByRole( 'button', {
			name: 'Previous month',
		} );
		const nextMonth = calendar.getByRole( 'button', {
			name: 'Next month',
		} );

		await prevMonth.click();
		await expect( prevMonth ).toBeFocused();
		await expect( calendar ).toBeVisible();

		await nextMonth.click();
		await expect( nextMonth ).toBeFocused();
		await expect( calendar ).toBeVisible();
	} );
} );
