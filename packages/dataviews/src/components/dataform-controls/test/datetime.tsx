import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import { setSettings, getSettings } from '@wordpress/date';
import DataForm from '../../../dataform';
import type { Field } from '../../../types';

type TestItem = { id: number; publishedAt: string };

const fields: Field< TestItem >[] = [
	{
		id: 'publishedAt',
		label: 'Published at',
		type: 'datetime',
	},
];

const form = { fields: [ 'publishedAt' ] };

function ControlledDataForm( { initialValue }: { initialValue: string } ) {
	const [ item, setItem ] = useState< TestItem >( {
		id: 1,
		publishedAt: initialValue,
	} );
	return (
		<DataForm
			data={ item }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setItem( ( previous ) => ( { ...previous, ...edits } ) )
			}
		/>
	);
}

describe( 'dataform-controls/datetime', () => {
	const originalSettings = getSettings();

	afterEach( () => {
		setSettings( originalSettings );
		jest.useRealTimers();
	} );

	/**
	 * Jest pins the browser timezone to UTC, so the mismatch is created from
	 * the WordPress side. A site configured with a manual UTC offset — which is
	 * what a default install has — reports an empty `timezone.string`, so the
	 * calendar has no named zone to work in and falls back to the browser's.
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

	/**
	 * A site with a named timezone hands it to the calendar, which then works in
	 * the site frame.
	 *
	 * @param string Site timezone name.
	 * @param offset The zone's UTC offset, in hours.
	 * @param abbr   The zone's abbreviation.
	 */
	function setSiteTimezone( string: string, offset: number, abbr: string ) {
		setSettings( {
			...originalSettings,
			timezone: {
				offset,
				offsetFormatted: String( offset ),
				string,
				abbr,
			},
		} );
	}

	// A negative offset puts the site behind UTC, so the clicked day's midnight
	// lands on the previous day when it is re-anchored to the site timezone.
	it.each( [ -8, -5, 5.5, 9 ] )(
		'commits the day that was clicked on a site at UTC%s',
		async ( offset ) => {
			setSiteOffset( offset );
			const user = userEvent.setup();

			render(
				<ControlledDataForm initialValue="2026-08-15T12:30:00.000Z" />
			);

			// The wall clock the input shows depends on the site offset, so the
			// time of day is read off rather than hard-coded.
			const timeOfDay = screen
				.getByLabelText< HTMLInputElement >( 'Date time' )
				.value.split( 'T' )[ 1 ];

			await user.click(
				screen.getByRole( 'button', { name: /august 20, 2026/i } )
			);

			// The input renders the committed instant as a wall clock in the
			// site timezone, so it reads back the day that was clicked, with
			// the time of day preserved.
			expect(
				screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
			).toBe( `2026-08-20T${ timeOfDay }` );
		}
	);

	it( 'keeps the clicked day highlighted after it is committed', async () => {
		setSiteOffset( -8 );
		const user = userEvent.setup();

		render(
			<ControlledDataForm initialValue="2026-08-15T12:30:00.000Z" />
		);

		await user.click(
			screen.getByRole( 'button', { name: /august 20, 2026/i } )
		);

		expect(
			screen.getByRole( 'button', { name: /august 20, 2026, selected/i } )
		).toBeInTheDocument();
	} );

	// A named timezone keeps the calendar in the site frame, through the
	// calendar's `timeZone` prop. That path was not broken, and this guards it:
	// the instant below is still the 15th in the browser's (UTC) frame, so the
	// day only reads back as the 16th while the calendar works in the site's.
	it( 'shows and commits the clicked day on a site with a named timezone', async () => {
		setSiteTimezone( 'Asia/Tokyo', 9, 'JST' );
		const user = userEvent.setup();

		render(
			<ControlledDataForm initialValue="2026-08-15T21:30:00.000Z" />
		);

		// 21:30 UTC on the 15th is 06:30 on the 16th in Tokyo.
		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
		).toBe( '2026-08-16T06:30' );
		expect(
			screen.getByRole( 'button', { name: /august 16, 2026, selected/i } )
		).toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', { name: /august 20, 2026/i } )
		);

		// The clicked day keeps the wall clock the value held.
		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
		).toBe( '2026-08-20T06:30' );
		expect(
			screen.getByRole( 'button', { name: /august 20, 2026, selected/i } )
		).toBeInTheDocument();
	} );

	// The value is a wall clock in the site timezone, so the day marked as today
	// is the site's — as in the date picker used outside DataForm — rather than
	// the browser's.
	it( 'marks the site today on a site with a named timezone', () => {
		jest.useFakeTimers();
		// 20:00 UTC on the 15th is already 10:00 on the 16th at UTC+14.
		jest.setSystemTime( new Date( '2026-08-15T20:00:00.000Z' ) );
		setSiteTimezone( 'Pacific/Kiritimati', 14, '+14' );

		render(
			<ControlledDataForm initialValue="2026-08-10T12:30:00.000Z" />
		);

		expect(
			screen.getByRole( 'button', { name: /today,.*august 16, 2026/i } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /today,.*august 15, 2026/i } )
		).not.toBeInTheDocument();
	} );

	// The input edits the value as a wall clock in the site timezone, and the
	// calendar has to follow the day that wall clock names — the same pairing the
	// `Quick Edit Date Timezone Consistency` e2e spec covers, whose site is set
	// to `Etc/GMT+5` (UTC-5).
	it( 'edits the value as a site wall clock through the input', async () => {
		setSiteTimezone( 'Etc/GMT+5', -5, '-05' );

		render(
			<ControlledDataForm initialValue="2026-02-15T17:30:00.000Z" />
		);

		const input = screen.getByLabelText< HTMLInputElement >( 'Date time' );

		// 17:30 UTC is 12:30 on a site five hours behind.
		expect( input.value ).toBe( '2026-02-15T12:30' );
		expect(
			screen.getByRole( 'button', {
				name: /february 15, 2026, selected/i,
			} )
		).toBeInTheDocument();

		// Changing the day keeps the time of day, and the calendar follows.
		fireEvent.change( input, { target: { value: '2026-03-20T12:30' } } );

		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
		).toBe( '2026-03-20T12:30' );
		expect(
			screen.getByRole( 'button', {
				name: /march 20, 2026, selected/i,
			} )
		).toBeInTheDocument();

		// Changing only the time leaves the day alone.
		fireEvent.change( input, { target: { value: '2026-03-20T09:45' } } );

		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
		).toBe( '2026-03-20T09:45' );
		expect(
			screen.getByRole( 'button', {
				name: /march 20, 2026, selected/i,
			} )
		).toBeInTheDocument();
	} );

	it( 'starts a value that was not set yet at the beginning of the day', async () => {
		setSiteOffset( -8 );
		const user = userEvent.setup();

		// The calendar keeps showing the month of the value it was rendered
		// with, so the day to click stays deterministic once it is cleared.
		render(
			<ControlledDataForm initialValue="2026-08-15T12:30:00.000Z" />
		);

		await user.clear( screen.getByLabelText( 'Date time' ) );

		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
		).toBe( '' );

		await user.click(
			screen.getByRole( 'button', { name: /august 20, 2026/i } )
		);

		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
		).toBe( '2026-08-20T00:00' );
	} );
} );
