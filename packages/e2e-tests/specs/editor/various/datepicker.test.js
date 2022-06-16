/**
 * WordPress dependencies
 */
import { createNewPost, changeSiteTimezone } from '@wordpress/e2e-test-utils';

async function getInputValue( selector ) {
	return page.$eval( selector, ( element ) => element.value );
}

async function getSelectedOptionLabel( selector ) {
	return page.$eval(
		selector,
		( element ) => element.options[ element.selectedIndex ].text
	);
}

async function getDatePickerValues() {
	const year = await getInputValue(
		'.components-datetime__time-field-year input'
	);
	const month = await getInputValue(
		'.components-datetime__time-field-month select'
	);
	const monthLabel = await getSelectedOptionLabel(
		'.components-datetime__time-field-month select'
	);
	const day = await getInputValue(
		'.components-datetime__time-field-day input'
	);
	const hours = await getInputValue(
		'.components-datetime__time-field-hours-input input'
	);
	const minutes = await getInputValue(
		'.components-datetime__time-field-minutes-input input'
	);
	const amOrPm = await page.$eval(
		'.components-datetime__time-field-am-pm .is-primary',
		( element ) => element.innerText.toLowerCase()
	);

	return { year, month, monthLabel, day, hours, minutes, amOrPm };
}

function trimLeadingZero( str ) {
	return str[ 0 ] === '0' ? str.slice( 1 ) : str;
}

function formatDatePickerValues(
	{ year, monthLabel, day, hours, minutes, amOrPm },
	timezone
) {
	const dayTrimmed = trimLeadingZero( day );
	const hoursTrimmed = trimLeadingZero( hours );
	return `${ monthLabel } ${ dayTrimmed }, ${ year } ${ hoursTrimmed }:${ minutes }\xa0${ amOrPm } ${ timezone }`;
}

async function getPublishingDate() {
	return page.$eval(
		'.edit-post-post-schedule__toggle',
		( dateLabel ) => dateLabel.textContent
	);
}

describe.each( [ [ 'UTC-10' ], [ 'UTC' ], [ 'UTC+10' ] ] )(
	`Datepicker %s`,
	( timezone ) => {
		let oldTimezone;
		beforeEach( async () => {
			await page.emulateTimezone( 'America/New_York' ); // Set browser to a timezone that's different to `timezone`.
			oldTimezone = await changeSiteTimezone( timezone );
			await createNewPost();
		} );
		afterEach( async () => {
			await changeSiteTimezone( oldTimezone );
			await page.emulateTimezone( null );
		} );

		it( 'should show the publishing date as "Immediately" if the date is not altered', async () => {
			const publishingDate = await getPublishingDate();

			expect( publishingDate ).toEqual( 'Immediately' );
		} );

		it( 'should show the publishing date if the date is in the past', async () => {
			// Open the datepicker.
			await page.click( '.edit-post-post-schedule__toggle' );

			// Change the publishing date to a year in the past.
			await page.click( '.components-datetime__time-field-year' );
			await page.keyboard.press( 'ArrowDown' );
			const datePickerValues = await getDatePickerValues();

			// Close the datepicker.
			await page.click( '.edit-post-post-schedule__toggle' );

			const publishingDate = await getPublishingDate();

			expect( publishingDate ).toBe(
				formatDatePickerValues( datePickerValues, timezone )
			);
		} );

		it( 'should show the publishing date if the date is in the future', async () => {
			// Open the datepicker.
			await page.click( '.edit-post-post-schedule__toggle' );

			// Change the publishing date to a year in the future.
			await page.click( '.components-datetime__time-field-year' );
			await page.keyboard.press( 'ArrowUp' );
			const datePickerValues = await getDatePickerValues();

			// Close the datepicker.
			await page.click( '.edit-post-post-schedule__toggle' );

			const publishingDate = await getPublishingDate();

			expect( publishingDate ).not.toEqual( 'Immediately' );
			// The expected date format will be "Sep 26, 2018 11:52 pm".
			expect( publishingDate ).toBe(
				formatDatePickerValues( datePickerValues, timezone )
			);
		} );

		it( `should show the publishing date as "Immediately" if the date is cleared`, async () => {
			// Open the datepicker.
			await page.click( '.edit-post-post-schedule__toggle' );

			// Change the publishing date to a year in the future.
			await page.click( '.components-datetime__time-field-year' );
			await page.keyboard.press( 'ArrowUp' );

			// Close the datepicker.
			await page.click( '.edit-post-post-schedule__toggle' );

			// Open the datepicker.
			await page.click( '.edit-post-post-schedule__toggle' );

			// Clear the date.
			await page.click(
				'.block-editor-publish-date-time-picker button[aria-label="Now"]'
			);

			const publishingDate = await getPublishingDate();

			expect( publishingDate ).toEqual( 'Immediately' );
		} );
	}
);
