import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import { setSettings, getSettings } from '@wordpress/date';
import DataForm from '../../../dataform';
import DateControl from '../date';
import type { DataFormControlProps, Field } from '../../../types';

type TestItem = { id: number; publishedOn: string };
type RangeTestItem = { id: number; window: [ string, string ] };

const fields: Field< TestItem >[] = [
	{
		id: 'publishedOn',
		label: 'Published on',
		type: 'date',
	},
];

const form = { fields: [ 'publishedOn' ] };

// The range calendar is only rendered for the `between` operator, which a form
// reaches through a custom `Edit` component.
const DateRangeEdit = ( props: DataFormControlProps< RangeTestItem > ) => (
	<DateControl { ...props } operator="between" />
);

const rangeFields: Field< RangeTestItem >[] = [
	{
		id: 'window',
		label: 'Window',
		type: 'date',
		Edit: DateRangeEdit,
	},
];

const rangeForm = { fields: [ 'window' ] };

function ControlledDataForm( { initialValue }: { initialValue: string } ) {
	const [ item, setItem ] = useState< TestItem >( {
		id: 1,
		publishedOn: initialValue,
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

function ControlledRangeDataForm( {
	initialValue,
}: {
	initialValue: [ string, string ];
} ) {
	const [ item, setItem ] = useState< RangeTestItem >( {
		id: 1,
		window: initialValue,
	} );
	return (
		<DataForm
			data={ item }
			fields={ rangeFields }
			form={ rangeForm }
			onChange={ ( edits ) =>
				setItem( ( previous ) => ( { ...previous, ...edits } ) )
			}
		/>
	);
}

describe( 'dataform-controls/date', () => {
	const originalSettings = getSettings();

	afterEach( () => {
		setSettings( originalSettings );
		jest.useRealTimers();
	} );

	/**
	 * Jest pins the browser timezone to UTC, so the mismatch is created from the
	 * WordPress side: a site behind UTC used to shift the plain calendar day onto
	 * the previous one.
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

	it.each( [ -8, -5, 5.5, 9 ] )(
		'shows the stored day as selected on a site at UTC%s',
		async ( offset ) => {
			setSiteOffset( offset );

			render( <ControlledDataForm initialValue="2026-08-20" /> );

			expect(
				screen.getByRole( 'button', {
					name: /august 20, 2026, selected/i,
				} )
			).toBeInTheDocument();
		}
	);

	it( 'commits the day that was clicked', async () => {
		setSiteOffset( -8 );
		const user = userEvent.setup();

		render( <ControlledDataForm initialValue="2026-08-20" /> );

		await user.click(
			screen.getByRole( 'button', { name: /august 25, 2026/i } )
		);

		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date' ).value
		).toBe( '2026-08-25' );
		expect(
			screen.getByRole( 'button', {
				name: /august 25, 2026, selected/i,
			} )
		).toBeInTheDocument();
	} );

	// A named timezone kept the calendar in the site frame before this fix,
	// through its `timeZone` prop; this guards the path now that the prop is
	// gone and the day is anchored to the browser instead.
	it( 'shows and commits the right day on a site with a named timezone', async () => {
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

		render( <ControlledDataForm initialValue="2026-08-20" /> );

		expect(
			screen.getByRole( 'button', {
				name: /august 20, 2026, selected/i,
			} )
		).toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', { name: /august 25, 2026/i } )
		);

		expect(
			screen.getByLabelText< HTMLInputElement >( 'Date' ).value
		).toBe( '2026-08-25' );
	} );

	// A `date` is a plain calendar day, so the day marked as today is the
	// browser's — the day the `Today` preset commits — even on a site whose own
	// date is already the next one.
	it( 'marks the browser today, not the site today', () => {
		jest.useFakeTimers();
		// 20:00 UTC on the 15th is already 10:00 on the 16th at UTC+14.
		jest.setSystemTime( new Date( '2026-08-15T20:00:00.000Z' ) );
		setSettings( {
			...originalSettings,
			timezone: {
				offset: 14,
				offsetFormatted: '14',
				string: 'Pacific/Kiritimati',
				abbr: '+14',
			},
		} );

		render( <ControlledDataForm initialValue="2026-08-10" /> );

		expect(
			screen.getByRole( 'button', { name: /today,.*august 15, 2026/i } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /today,.*august 16, 2026/i } )
		).not.toBeInTheDocument();
	} );

	// The range calendar reads and reports its days in the same frame as the
	// single-date one, so a stored bound has to be highlighted on the day it
	// names rather than on the adjacent one.
	it( 'shows both stored bounds of a range as selected', () => {
		setSiteOffset( -8 );

		render(
			<ControlledRangeDataForm
				initialValue={ [ '2026-08-10', '2026-08-20' ] }
			/>
		);

		expect(
			screen.getByLabelText< HTMLInputElement >( 'From' ).value
		).toBe( '2026-08-10' );
		expect( screen.getByLabelText< HTMLInputElement >( 'To' ).value ).toBe(
			'2026-08-20'
		);
		expect(
			screen.getByRole( 'button', {
				name: /august 10, 2026, selected/i,
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', {
				name: /august 20, 2026, selected/i,
			} )
		).toBeInTheDocument();
	} );

	it( 'commits the days that were clicked as the range bounds', async () => {
		setSiteOffset( -8 );
		const user = userEvent.setup();

		// The calendar keeps showing the month of the range it was rendered
		// with, so the days to click stay deterministic once it is cleared.
		render(
			<ControlledRangeDataForm
				initialValue={ [ '2026-08-10', '2026-08-20' ] }
			/>
		);

		await user.clear( screen.getByLabelText( 'From' ) );
		await user.clear( screen.getByLabelText( 'To' ) );

		await user.click(
			screen.getByRole( 'button', { name: /august 12, 2026/i } )
		);
		await user.click(
			screen.getByRole( 'button', { name: /august 18, 2026/i } )
		);

		expect(
			screen.getByLabelText< HTMLInputElement >( 'From' ).value
		).toBe( '2026-08-12' );
		expect( screen.getByLabelText< HTMLInputElement >( 'To' ).value ).toBe(
			'2026-08-18'
		);
	} );
} );
