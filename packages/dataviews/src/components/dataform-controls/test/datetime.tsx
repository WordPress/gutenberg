import { render, screen } from '@testing-library/react';
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

const noop = () => {};

const getMonthGrid = ( monthLabel: string ) =>
	screen.getByRole( 'grid', { name: monthLabel } );

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

	it( 'moves the calendar to an externally changed value', () => {
		const { rerender } = render(
			<DataForm
				data={ {
					id: 1,
					publishedAt: '2024-03-15T10:30:00.000Z',
				} }
				fields={ fields }
				form={ form }
				onChange={ noop }
			/>
		);

		expect( getMonthGrid( 'March 2024' ) ).toBeInTheDocument();

		rerender(
			<DataForm
				data={ {
					id: 1,
					publishedAt: '2024-11-20T10:30:00.000Z',
				} }
				fields={ fields }
				form={ form }
				onChange={ noop }
			/>
		);

		expect( getMonthGrid( 'November 2024' ) ).toBeInTheDocument();
	} );

	it( 'compares external month changes in the named site timezone', () => {
		setSettings( {
			...originalSettings,
			timezone: {
				offset: 14,
				offsetFormatted: '14',
				string: 'Pacific/Kiritimati',
				abbr: '+14',
			},
		} );
		const { rerender } = render(
			<DataForm
				data={ {
					id: 1,
					publishedAt: '2026-02-15T10:00:00.000Z',
				} }
				fields={ fields }
				form={ form }
				onChange={ noop }
			/>
		);

		expect( getMonthGrid( 'February 2026' ) ).toBeInTheDocument();

		rerender(
			<DataForm
				data={ {
					id: 1,
					publishedAt: '2026-02-28T12:00:00.000Z',
				} }
				fields={ fields }
				form={ form }
				onChange={ noop }
			/>
		);

		expect( getMonthGrid( 'March 2026' ) ).toBeInTheDocument();
	} );

	/**
	 * Jest pins the browser timezone to UTC, so the mismatch is created from
	 * the WordPress side. A site configured with a manual UTC offset — which is
	 * what a default install has — reports an empty `timezone.string`, and the
	 * control maps the site's wall-clock fields into the UTC calendar frame.
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

	describe( 'manual UTC offsets', () => {
		it( 'moves to the site month after an external value change', () => {
			setSiteOffset( 14 );
			const { rerender } = render(
				<DataForm
					data={ {
						id: 1,
						publishedAt: '2026-02-15T10:00:00.000Z',
					} }
					fields={ fields }
					form={ form }
					onChange={ noop }
				/>
			);

			expect( getMonthGrid( 'February 2026' ) ).toBeInTheDocument();

			rerender(
				<DataForm
					data={ {
						id: 1,
						publishedAt: '2026-02-28T12:00:00.000Z',
					} }
					fields={ fields }
					form={ form }
					onChange={ noop }
				/>
			);

			expect( getMonthGrid( 'March 2026' ) ).toBeInTheDocument();
		} );

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
					screen.getByLabelText< HTMLInputElement >( 'Date time' )
						.value
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
				screen.getByRole( 'button', {
					name: /august 20, 2026, selected/i,
				} )
			).toBeInTheDocument();
		} );

		it( 'starts a datetime selected from the calendar at midnight', async () => {
			setSiteOffset( -8 );
			const user = userEvent.setup();

			render( <ControlledDataForm initialValue="" /> );

			await user.click(
				screen.getByRole( 'button', { name: /august 25, 2026/i } )
			);

			expect(
				screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
			).toBe( '2026-08-25T00:00' );
		} );

		it( 'marks the site today, not the browser today', () => {
			jest.useFakeTimers();
			// 20:00 UTC on Aug 15 is already Aug 16, 10:00 on a UTC+14 site.
			jest.setSystemTime( new Date( '2026-08-15T20:00:00.000Z' ) );
			setSiteOffset( 14 );

			render(
				<ControlledDataForm initialValue="2026-08-10T12:30:00.000Z" />
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

	// A named timezone kept the two frames aligned all along, through the
	// calendar's `timeZone` prop; this guards that path.
	it( 'commits the clicked day on a site with a named timezone', async () => {
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

		render(
			<ControlledDataForm initialValue="2026-08-15T12:30:00.000Z" />
		);

		await user.click(
			screen.getByRole( 'button', { name: /august 20, 2026/i } )
		);

		// 12:30 UTC is 21:30 in Tokyo; the clicked day keeps that wall clock.
		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date time' ).value
		).toBe( '2026-08-20T21:30' );
		expect(
			screen.getByRole( 'button', { name: /august 20, 2026, selected/i } )
		).toBeInTheDocument();
	} );
} );
