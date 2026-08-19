import { render, screen } from '@testing-library/react';
import { startOfDay } from 'date-fns';
import { ckb, enUS, faIR, ug } from 'date-fns/locale';
import { Calendar, RangeCalendar } from '..';
import {
	dateNumberFormatter,
	fullDateFormatter,
	monthNameFormatter,
	weekdayFormatter,
} from './__utils__';

const TEST_DATE = new Date( 2026, 0, 15 );

function expectGregorianDate( localeCode: string ) {
	expect(
		screen.getByRole( 'grid', {
			name: monthNameFormatter( localeCode ).format( TEST_DATE ),
		} )
	).toBeVisible();
	expect(
		screen.getByRole( 'gridcell', {
			name: dateNumberFormatter( localeCode ).format( TEST_DATE ),
		} )
	).toBeVisible();
	expect(
		screen.getByRole( 'button', {
			name: fullDateFormatter( localeCode ).format( TEST_DATE ),
		} )
	).toBeVisible();
}

jest.mock( '@wordpress/i18n', () => {
	const actual = jest.requireActual( '@wordpress/i18n' );
	const translations: Record< string, string > = {
		'Go to the Previous Month': 'Translated previous month',
		'Today, %s, selected': 'Today and selected: %s',
	};

	return {
		...actual,
		__: ( text: string ) => translations[ text ] ?? text,
	};
} );

describe.each( [
	[ 'Calendar', Calendar ],
	[ 'RangeCalendar', RangeCalendar ],
] as const )( '%s localization', ( _name, Component ) => {
	it( 'localizes visible text from a BCP 47 locale code', () => {
		render( <Component defaultMonth={ TEST_DATE } localeCode="fr-FR" /> );

		expect(
			screen.getByText(
				monthNameFormatter( 'fr-FR' ).format( TEST_DATE )
			)
		).toBeVisible();
	} );

	it( 'keeps Persian date text on the Gregorian calendar', () => {
		expect.hasAssertions();
		render( <Component defaultMonth={ TEST_DATE } localeCode="fa-IR" /> );

		expectGregorianDate( 'fa-IR' );
	} );

	it( 'should preserve localized defaults when overriding one label', () => {
		render(
			<Component labels={ { labelNext: () => 'Custom next month' } } />
		);

		expect(
			screen.getByRole( 'button', { name: 'Custom next month' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', {
				name: 'Translated previous month',
			} )
		).toBeVisible();
	} );
} );

describe( 'Calendar locale inputs', () => {
	it( 'keeps supporting a date-fns locale object on the Gregorian calendar', () => {
		expect.hasAssertions();
		render( <Calendar defaultMonth={ TEST_DATE } locale={ faIR } /> );

		expectGregorianDate( 'fa-IR' );
	} );

	it( 'uses the locale code for Intl formatting and direction when both locale inputs are supplied', () => {
		render(
			<Calendar
				defaultMonth={ TEST_DATE }
				locale={ enUS }
				localeCode="fa-IR"
			/>
		);

		expectGregorianDate( 'fa-IR' );
		expect(
			screen.getByRole( 'application', { name: 'Date calendar' } )
		).toHaveAttribute( 'dir', 'rtl' );
	} );

	it.each( [ 'not_a_locale', 'xx-XX' ] )(
		'falls back to the date-fns locale for invalid or unsupported locale code %s',
		( localeCode ) => {
			expect( () =>
				render(
					<Calendar
						defaultMonth={ TEST_DATE }
						locale={ faIR }
						localeCode={ localeCode }
					/>
				)
			).not.toThrow();

			expectGregorianDate( 'fa-IR' );
		}
	);

	it( 'lets an explicit direction override the locale-derived direction', () => {
		render( <Calendar localeCode="fa-IR" dir="ltr" /> );

		expect(
			screen.getByRole( 'application', { name: 'Date calendar' } )
		).toHaveAttribute( 'dir', 'ltr' );
	} );

	it( 'keeps the date-fns locale as the default source for the week start', () => {
		render(
			<Calendar
				defaultMonth={ TEST_DATE }
				locale={ faIR }
				localeCode="en-US"
			/>
		);

		expect(
			screen.getAllByRole( 'columnheader', { hidden: true } )[ 0 ]
		).toHaveAccessibleName(
			weekdayFormatter( 'en-US' ).format( new Date( 2026, 0, 10 ) )
		);
	} );

	it( 'lets an explicit weekStartsOn override the date-fns locale', () => {
		render(
			<Calendar
				defaultMonth={ TEST_DATE }
				locale={ faIR }
				localeCode="fa-IR"
				weekStartsOn={ 1 }
			/>
		);

		expect(
			screen.getAllByRole( 'columnheader', { hidden: true } )[ 0 ]
		).toHaveAccessibleName(
			weekdayFormatter( 'fa-IR' ).format( new Date( 2026, 0, 12 ) )
		);
	} );
} );

describe( 'Calendar day labels', () => {
	it( 'should announce when today is selected in a single calendar', () => {
		const today = startOfDay( new Date() );
		render( <Calendar value={ today } /> );

		expect(
			screen.getByRole( 'button', { name: /^Today and selected:/ } )
		).toBeVisible();
	} );

	it( 'should announce when today is selected in a range calendar', () => {
		const today = startOfDay( new Date() );
		render( <RangeCalendar value={ { from: today, to: today } } /> );

		expect(
			screen.getByRole( 'button', { name: /^Today and selected:/ } )
		).toBeVisible();
	} );
} );

describe( 'Calendar text direction fallback', () => {
	const getTextInfoDescriptor = Object.getOwnPropertyDescriptor(
		Intl.Locale.prototype,
		'getTextInfo'
	);

	beforeAll( () => {
		Object.defineProperty( Intl.Locale.prototype, 'getTextInfo', {
			configurable: true,
			value: undefined,
		} );
	} );

	afterAll( () => {
		if ( getTextInfoDescriptor ) {
			Object.defineProperty(
				Intl.Locale.prototype,
				'getTextInfo',
				getTextInfoDescriptor
			);
		} else {
			delete ( Intl.Locale.prototype as { getTextInfo?: unknown } )
				.getTextInfo;
		}
	} );

	it.each( [
		[ 'Central Kurdish', ckb ],
		[ 'Uyghur', ug ],
	] )(
		'should render %s right-to-left without Intl.Locale.getTextInfo',
		( _, locale ) => {
			render( <Calendar locale={ locale } /> );

			expect(
				screen.getByRole( 'application', { name: 'Date calendar' } )
			).toHaveAttribute( 'dir', 'rtl' );
		}
	);
} );
