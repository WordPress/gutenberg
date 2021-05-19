/**
 * WordPress dependencies
 */
import { createNewPost, changeSiteTimezone } from '@wordpress/e2e-test-utils';

async function getPublishButtonText() {
	return page.$eval(
		'.editor-post-publish-button__button',
		( element ) => element.textContent
	);
}

describe( 'Scheduling', () => {
	const isDateTimeComponentFocused = () => {
		return page.evaluate( () => {
			const dateTimeElement = document.querySelector(
				'.components-datetime__date'
			);
			if ( ! dateTimeElement || ! document.activeElement ) {
				return false;
			}
			return dateTimeElement.contains( document.activeElement );
		} );
	};

	describe.each( [ [ 'UTC-10' ], [ 'UTC' ], [ 'UTC+10' ] ] )(
		`Timezone %s`,
		( timezone ) => {
			let oldTimezone;
			beforeEach( async () => {
				oldTimezone = await changeSiteTimezone( timezone );
				await createNewPost();
			} );
			afterEach( async () => {
				await changeSiteTimezone( oldTimezone );
			} );

			it( `should change publishing button text from "Publish" to "Schedule"`, async () => {
				expect( await getPublishButtonText() ).toBe( 'Publish' );

				// Open the datepicker.
				await page.click( '.edit-post-post-schedule__toggle' );

				// Change the publishing date to a year in the future.
				await page.click( '.components-datetime__time-field-year' );
				await page.keyboard.press( 'ArrowUp' );

				// Close the datepicker.
				await page.click( '.edit-post-post-schedule__toggle' );

				expect( await getPublishButtonText() ).toBe( 'Schedule…' );
			} );
		}
	);

	it( 'Should keep date time UI focused when the previous and next month buttons are clicked', async () => {
		await createNewPost();

		await page.click( '.edit-post-post-schedule__toggle' );
		await page.click(
			'div[aria-label="Move backward to switch to the previous month."]'
		);
		expect( await isDateTimeComponentFocused() ).toBe( true );
		await page.click(
			'div[aria-label="Move forward to switch to the next month."]'
		);
		expect( await isDateTimeComponentFocused() ).toBe( true );
	} );
} );
