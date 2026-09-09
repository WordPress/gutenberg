import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calendar } from '..';
import { weekdayFormatter } from './__utils__';

const TEST_DATE = new Date( 2026, 0, 15 );

function mockIntlLocaleProperties(
	getDescriptors: ( locale: Intl.Locale ) => PropertyDescriptorMap
) {
	const IntlLocale = Intl.Locale;
	const localeSpy = vi
		.spyOn( Intl, 'Locale' )
		.mockImplementation( function Locale( locale ) {
			const intlLocale = new IntlLocale( locale );
			Object.defineProperties( intlLocale, getDescriptors( intlLocale ) );
			return intlLocale;
		} );

	return () => localeSpy.mockRestore();
}

function expectFirstWeekday( localeCode: string, date: Date ) {
	expect(
		screen.getAllByRole( 'columnheader', { hidden: true } )[ 0 ]
	).toHaveAccessibleName( weekdayFormatter( localeCode ).format( date ) );
}

describe( 'Calendar Intl.Locale compatibility', () => {
	it( 'derives the week start from legacy weekInfo', () => {
		expect.hasAssertions();
		const restore = mockIntlLocaleProperties( () => ( {
			getWeekInfo: { value: undefined },
			weekInfo: { value: { firstDay: 6 } },
		} ) );

		try {
			render( <Calendar defaultMonth={ TEST_DATE } locale="fa-IR" /> );
			expectFirstWeekday( 'fa-IR', new Date( 2026, 0, 10 ) );
		} finally {
			restore();
		}
	} );

	it( 'uses the existing default without a week information API', () => {
		expect.hasAssertions();
		const restore = mockIntlLocaleProperties( () => ( {
			getWeekInfo: { value: undefined },
			weekInfo: { value: undefined },
		} ) );

		try {
			render( <Calendar defaultMonth={ TEST_DATE } locale="fa-IR" /> );
			expectFirstWeekday( 'fa-IR', new Date( 2026, 0, 11 ) );
		} finally {
			restore();
		}
	} );

	it.each( [
		[ 'Sindhi', 'sd', 'rtl' ],
		[ 'Latin-script Uyghur', 'ug-Latn', 'ltr' ],
	] as const )( 'uses legacy textInfo for %s', ( _, locale, direction ) => {
		const restore = mockIntlLocaleProperties( ( intlLocale ) => ( {
			getTextInfo: { value: undefined },
			textInfo: {
				value: {
					direction: intlLocale.language === 'sd' ? 'rtl' : 'ltr',
				},
			},
		} ) );

		try {
			render( <Calendar locale={ locale } /> );
			expect( screen.getByRole( 'application' ) ).toHaveAttribute(
				'dir',
				direction
			);
		} finally {
			restore();
		}
	} );

	it( 'uses the language fallback without a text information API', () => {
		const restore = mockIntlLocaleProperties( () => ( {
			getTextInfo: { value: undefined },
			textInfo: { value: undefined },
		} ) );

		try {
			render( <Calendar locale="fa-IR" /> );
			expect( screen.getByRole( 'application' ) ).toHaveAttribute(
				'dir',
				'rtl'
			);
		} finally {
			restore();
		}
	} );
} );
