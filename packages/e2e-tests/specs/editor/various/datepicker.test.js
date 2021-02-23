/**
 * WordPress dependencies
 */
import {
	createNewPost,
	changeSiteTimezone,
	findSidebarPanelToggleButtonWithTitle,
} from '@wordpress/e2e-test-utils';

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
	const year = await getInputValue( '[aria-label="Year"]' );
	const month = await getInputValue( '[aria-label="Month"]' );
	const monthLabel = await getSelectedOptionLabel( '[aria-label="Month"]' );
	const day = await getInputValue( '[aria-label="Day"]' );
	const hours = await getInputValue( '[aria-label="Hours"]' );
	const minutes = await getInputValue( '[aria-label="Minutes"]' );
	const amOrPm = await page.$eval(
		'.components-datetime__time-field-am-pm .is-primary',
		( element ) => element.innerText.toLowerCase()
	);

	return { year, month, monthLabel, day, hours, minutes, amOrPm };
}

function trimLeadingZero( str ) {
	return str[ 0 ] === '0' ? str.slice( 1 ) : str;
}

function formatDatePickerValues( {
	year,
	monthLabel,
	day,
	hours,
	minutes,
	amOrPm,
} ) {
	const dayTrimmed = trimLeadingZero( day );
	const hoursTrimmed = trimLeadingZero( hours );
	return `${ monthLabel } ${ dayTrimmed }, ${ year } ${ hoursTrimmed }:${ minutes } ${ amOrPm }`;
}

async function getPublishingDate() {
	const panelToggle = await findSidebarPanelToggleButtonWithTitle(
		'Publish date:'
	);
	return panelToggle.$eval(
		'.editor-post-publish-panel__link',
		( publishDateSpan ) => publishDateSpan.textContent
	);
}

describe.each( [ [ 'UTC-10' ], [ 'UTC' ], [ 'UTC+10' ] ] )(
	`Datepicker %s`,
	( timezone ) => {
		let oldTimezone;
		beforeEach( async () => {
			oldTimezone = await changeSiteTimezone( timezone );
			await createNewPost();
		} );
		afterEach( async () => {
			await changeSiteTimezone( oldTimezone );
		} );

		it( 'should show the publishing date as "Immediately" if the date is not altered', async () => {
			// Open the datepicker.
			const panelToggle = await findSidebarPanelToggleButtonWithTitle(
				'Publish date:'
			);
			await panelToggle.click();

			const publishingDate = await getPublishingDate();

			expect( publishingDate ).toEqual( 'Immediately' );
		} );

		it( 'should show the publishing date if the date is in the past', async () => {
			// Open the datepicker.
			const panelToggle = await findSidebarPanelToggleButtonWithTitle(
				'Publish date:'
			);
			await panelToggle.click();

			// Change the publishing date to a year in the past.
			await page.click( '.components-datetime__time-field-year' );
			await page.keyboard.press( 'ArrowDown' );
			const datePickerValues = await getDatePickerValues();

			// Close the datepicker.
			await panelToggle.click();

			const publishingDate = await getPublishingDate();

			expect( publishingDate ).toBe(
				formatDatePickerValues( datePickerValues )
			);
		} );

		it( 'should show the publishing date if the date is in the future', async () => {
			// Open the datepicker.
			const panelToggle = await findSidebarPanelToggleButtonWithTitle(
				'Publish date:'
			);
			await panelToggle.click();

			// Change the publishing date to a year in the future.
			await page.click( '.components-datetime__time-field-year' );
			await page.keyboard.press( 'ArrowUp' );
			const datePickerValues = await getDatePickerValues();

			// Close the datepicker.
			await panelToggle.click();

			const publishingDate = await getPublishingDate();

			expect( publishingDate ).not.toEqual( 'Immediately' );
			// The expected date format will be "Sep 26, 2018 11:52 pm".
			expect( publishingDate ).toBe(
				formatDatePickerValues( datePickerValues )
			);
		} );

		it( `should show the publishing date as "Immediately" if the date is cleared`, async () => {
			// Open the datepicker.
			const panelToggle = await findSidebarPanelToggleButtonWithTitle(
				'Publish date:'
			);
			await panelToggle.click();

			// Change the publishing date to a year in the future.
			await page.click( '.components-datetime__time-field-year' );
			await page.keyboard.press( 'ArrowUp' );

			// Close the datepicker.
			await panelToggle.click();

			// Open the datepicker.
			await panelToggle.click();

			// Clear the date.
			await page.click( '.components-datetime__date-reset-button' );

			const publishingDate = await getPublishingDate();

			expect( publishingDate ).toEqual( 'Immediately' );
		} );
	}
);
