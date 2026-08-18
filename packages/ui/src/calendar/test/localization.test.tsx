import { render, screen } from '@testing-library/react';
import { startOfDay } from 'date-fns';
import { ckb, ug } from 'date-fns/locale';
import { Calendar, RangeCalendar } from '..';

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
