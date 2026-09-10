import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { ckb, ug } from 'date-fns/locale';
import { Calendar } from '..';
import { weekdayFormatter } from './__utils__';

const TEST_DATE = new Date( 2026, 0, 15 );

type IntlLocaleWithTextInfo = Intl.Locale & {
	getTextInfo?: () => { direction: string };
	textInfo?: { direction: string };
};

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
	it( 'derives the week start from legacy weekInfo', async () => {
		expect.hasAssertions();
		const restore = mockIntlLocaleProperties( () => ( {
			getWeekInfo: { value: undefined },
			weekInfo: { value: { firstDay: 6 } },
		} ) );

		try {
			await render(
				<Calendar defaultMonth={ TEST_DATE } locale="fa-IR" />
			);
			expectFirstWeekday( 'fa-IR', new Date( 2026, 0, 10 ) );
		} finally {
			restore();
		}
	} );

	it( 'uses the existing default without a week information API', async () => {
		expect.hasAssertions();
		const restore = mockIntlLocaleProperties( () => ( {
			getWeekInfo: { value: undefined },
			weekInfo: { value: undefined },
		} ) );

		try {
			await render(
				<Calendar defaultMonth={ TEST_DATE } locale="fa-IR" />
			);
			expectFirstWeekday( 'fa-IR', new Date( 2026, 0, 11 ) );
		} finally {
			restore();
		}
	} );

	it.each( [
		[ 'Sindhi', 'sd', 'rtl' ],
		[ 'Latin-script Uyghur', 'ug-Latn', 'ltr' ],
	] as const )(
		'uses legacy textInfo for %s',
		async ( _, locale, direction ) => {
			const restore = mockIntlLocaleProperties( ( intlLocale ) => {
				const localeWithTextInfo = intlLocale as IntlLocaleWithTextInfo;
				const textInfo =
					localeWithTextInfo.getTextInfo?.() ??
					localeWithTextInfo.textInfo;
				return {
					getTextInfo: { value: undefined },
					textInfo: { value: textInfo },
				};
			} );

			try {
				await render( <Calendar locale={ locale } /> );
				expect( screen.getByRole( 'application' ) ).toHaveAttribute(
					'dir',
					direction
				);
			} finally {
				restore();
			}
		}
	);

	it.each( [
		[ 'Central Kurdish', ckb ],
		[ 'Uyghur', ug ],
	] as const )(
		'uses the language fallback for the %s date-fns locale',
		async ( _, locale ) => {
			const restore = mockIntlLocaleProperties( () => ( {
				getTextInfo: { value: undefined },
				textInfo: { value: undefined },
			} ) );
			const supportedLocalesSpy = vi
				.spyOn( Intl.DateTimeFormat, 'supportedLocalesOf' )
				.mockReturnValue( [ locale.code ] );

			try {
				await render( <Calendar locale={ locale } /> );
				expect( screen.getByRole( 'application' ) ).toHaveAttribute(
					'dir',
					'rtl'
				);
			} finally {
				supportedLocalesSpy.mockRestore();
				restore();
			}
		}
	);

	it( 'uses the language fallback without a text information API', async () => {
		const restore = mockIntlLocaleProperties( () => ( {
			getTextInfo: { value: undefined },
			textInfo: { value: undefined },
		} ) );

		try {
			await render( <Calendar locale="fa-IR" /> );
			expect( screen.getByRole( 'application' ) ).toHaveAttribute(
				'dir',
				'rtl'
			);
		} finally {
			restore();
		}
	} );
} );
