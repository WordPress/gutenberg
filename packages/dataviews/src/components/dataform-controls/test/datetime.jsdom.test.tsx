import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSettings, setSettings } from '@wordpress/date';
import { useState } from '@wordpress/element';
import normalizeFields from '../../../field-types';
import DateTime from '../datetime';
import type { DataFormControlProps } from '../../../types';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const noop = () => {};

type TestItem = {
	published?: string;
};

const field = normalizeFields< TestItem >( [
	{
		id: 'published',
		label: 'Published',
		type: 'datetime',
	},
] )[ 0 ];

const getMonthGrid = ( monthLabel: string ) =>
	screen.getByRole( 'grid', { name: monthLabel } );

const supportsOffsetTimeZones = () => {
	try {
		new Intl.DateTimeFormat( 'en', { timeZone: '+05:30' } );
		return true;
	} catch {
		return false;
	}
};

// Raw offset identifiers are supported by the target browsers and Node 22+.
// Node 20 cannot mount Calendar with them because its Intl implementation
// rejects the identifier before the interaction can be tested.
const describeWithOffsetTimeZones = supportsOffsetTimeZones()
	? describe
	: describe.skip;

function DateTimeHarness( { initialValue }: { initialValue: string } ) {
	const [ data, setData ] = useState< TestItem >( {
		published: initialValue,
	} );
	const onChange: DataFormControlProps< TestItem >[ 'onChange' ] = (
		edits
	) => setData( ( current ) => ( { ...current, ...edits } ) as TestItem );
	return <DateTime data={ data } field={ field } onChange={ onChange } />;
}

describe( 'DateTime control', () => {
	const originalSettings = getSettings();

	beforeEach( () => {
		setSettings( {
			...originalSettings,
			timezone: {
				...originalSettings.timezone,
				string: 'UTC',
			},
		} );
	} );

	afterEach( () => {
		setSettings( originalSettings );
		jest.useRealTimers();
	} );

	it( 'should move the calendar to the month of a value changed from outside the control', () => {
		const { rerender } = render(
			<DateTime
				data={ { published: '2024-03-15T10:30:00.000Z' } }
				field={ field }
				onChange={ noop }
			/>
		);

		expect( getMonthGrid( 'March 2024' ) ).toBeInTheDocument();

		// External value change, e.g. an undo, a reset, or switching the
		// edited item.
		rerender(
			<DateTime
				data={ { published: '2024-11-20T10:30:00.000Z' } }
				field={ field }
				onChange={ noop }
			/>
		);

		expect( getMonthGrid( 'November 2024' ) ).toBeInTheDocument();
	} );

	describe( 'with a site time zone ahead of the browser', () => {
		beforeEach( () => {
			// UTC+14, ahead of every possible browser time zone.
			setSettings( {
				...originalSettings,
				timezone: {
					...originalSettings.timezone,
					string: 'Pacific/Kiritimati',
					offset: 14,
				},
			} );
		} );

		it( 'should move the calendar to the month of a value changed across a month boundary', () => {
			const { rerender } = render(
				<DateTime
					data={ { published: '2026-02-15T10:00:00.000Z' } }
					field={ field }
					onChange={ noop }
				/>
			);

			expect( getMonthGrid( 'February 2026' ) ).toBeInTheDocument();

			// This instant is March 1 in the site time zone, but still
			// February in the browser's, so a comparison in the wrong time
			// zone keeps the calendar on February and hides the selected day.
			rerender(
				<DateTime
					data={ { published: '2026-02-28T12:00:00.000Z' } }
					field={ field }
					onChange={ noop }
				/>
			);

			expect( getMonthGrid( 'March 2026' ) ).toBeInTheDocument();
		} );
	} );

	/**
	 * Jest pins the browser timezone to UTC, so the mismatch is created from
	 * the WordPress side. A site configured with a manual UTC offset reports an
	 * empty `timezone.string`, and the control passes the offset to Calendar.
	 *
	 * @param offset Site UTC offset, in hours.
	 */
	function setSiteOffset( offset: number ) {
		setSettings( {
			...originalSettings,
			timezone: {
				offset,
				offsetFormatted: String( offset ),
				string: '',
				abbr: '',
			},
		} );
	}

	describeWithOffsetTimeZones( 'with a manual UTC offset', () => {
		it( 'should move to the site month after an external value change', () => {
			setSiteOffset( 14 );
			const { rerender } = render(
				<DateTime
					data={ { published: '2026-02-15T10:00:00.000Z' } }
					field={ field }
					onChange={ noop }
				/>
			);

			expect( getMonthGrid( 'February 2026' ) ).toBeInTheDocument();

			rerender(
				<DateTime
					data={ { published: '2026-02-28T12:00:00.000Z' } }
					field={ field }
					onChange={ noop }
				/>
			);

			expect( getMonthGrid( 'March 2026' ) ).toBeInTheDocument();
		} );

		it.each( [ -8, -5, 5.5, 9 ] )(
			'should commit the day clicked on a site at UTC%s',
			async ( offset ) => {
				setSiteOffset( offset );
				const user = userEvent.setup();

				render(
					<DateTimeHarness initialValue="2026-08-15T12:30:00.000Z" />
				);

				const timeOfDay = screen
					.getByLabelText< HTMLInputElement >( 'Date time' )
					.value.split( 'T' )[ 1 ];

				await user.click(
					screen.getByRole( 'button', { name: /august 20, 2026/i } )
				);

				expect(
					screen.getByLabelText< HTMLInputElement >( 'Date time' )
						.value
				).toBe( `2026-08-20T${ timeOfDay }` );
			}
		);

		it( 'should keep the clicked day highlighted after it is committed', async () => {
			setSiteOffset( -8 );
			const user = userEvent.setup();

			render(
				<DateTimeHarness initialValue="2026-08-15T12:30:00.000Z" />
			);

			await user.click(
				screen.getByRole( 'button', { name: /august 20, 2026/i } )
			);

			expect(
				screen.getByRole( 'button', {
					name: /august 20, 2026, selected/i,
				} )
			).toBeInTheDocument();
		} );

		it( 'should start a datetime selected from the calendar at midnight', async () => {
			setSiteOffset( -8 );
			// Freeze the clock: with no value the calendar opens on the
			// current month, and the day clicked below must be in it.
			jest.useFakeTimers();
			jest.setSystemTime( new Date( '2026-08-15T12:00:00.000Z' ) );
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			render( <DateTimeHarness initialValue="" /> );

			await user.click(
				screen.getByRole( 'button', { name: /august 25, 2026/i } )
			);

			expect(
				screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
			).toBe( '2026-08-25T00:00' );
		} );

		it( "should mark the site's today", () => {
			jest.useFakeTimers();
			// 20:00 UTC on Aug 15 is already Aug 16 on a UTC+14 site.
			jest.setSystemTime( new Date( '2026-08-15T20:00:00.000Z' ) );
			setSiteOffset( 14 );

			render(
				<DateTimeHarness initialValue="2026-08-10T12:30:00.000Z" />
			);

			expect(
				screen.getByRole( 'button', {
					name: /today,.*august 16, 2026/i,
				} )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /today,.*august 15, 2026/i,
				} )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should commit the clicked day on a site with a named timezone', async () => {
		setSettings( {
			...originalSettings,
			timezone: {
				offset: 9,
				offsetFormatted: '9',
				string: 'Asia/Tokyo',
				abbr: 'JST',
			},
		} );
		const user = userEvent.setup();

		render( <DateTimeHarness initialValue="2026-08-15T12:30:00.000Z" /> );

		await user.click(
			screen.getByRole( 'button', { name: /august 20, 2026/i } )
		);

		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
		).toBe( '2026-08-20T21:30' );
		expect(
			screen.getByRole( 'button', {
				name: /august 20, 2026, selected/i,
			} )
		).toBeInTheDocument();
	} );
} );
