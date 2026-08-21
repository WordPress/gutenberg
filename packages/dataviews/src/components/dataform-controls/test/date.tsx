import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import { setSettings, getSettings } from '@wordpress/date';
import DataForm from '../../../dataform';
import type { DataFormControlProps, Field } from '../../../types';
import DateControl, { parseDate } from '../date';

type TestItem = { id: number; publishedOn: string };

const fields: Field< TestItem >[] = [
	{
		id: 'publishedOn',
		label: 'Published on',
		type: 'date',
	},
];

const form = { fields: [ 'publishedOn' ] };

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

type DateRangeTestItem = {
	id: number;
	publishedOn: [ string, string ];
};

const dateRangeFields: Field< DateRangeTestItem >[] = [
	{
		id: 'publishedOn',
		label: 'Published on',
		type: 'date',
		Edit: ( props: DataFormControlProps< DateRangeTestItem > ) => (
			<DateControl { ...props } operator="between" />
		),
	},
];

function ControlledDateRangeDataForm() {
	const [ item, setItem ] = useState< DateRangeTestItem >( {
		id: 1,
		publishedOn: [ '2026-08-20', '2026-08-22' ],
	} );
	return (
		<DataForm
			data={ item }
			fields={ dateRangeFields }
			form={ form }
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
	} );

	// Jest pins the browser timezone to UTC, so the mismatch is created from the
	// WordPress side: a site behind UTC used to shift the plain calendar day
	// onto the previous one.
	it.each( [ -8, -5, 5.5, 9 ] )(
		'shows the stored day as selected on a site at UTC%s',
		async ( offset ) => {
			setSettings( {
				...originalSettings,
				timezone: {
					offset,
					offsetFormatted: String( offset ),
					string: '',
					abbr: '',
				},
			} );

			render( <ControlledDataForm initialValue="2026-08-20" /> );

			expect(
				screen.getByRole( 'button', {
					name: /august 20, 2026, selected/i,
				} )
			).toBeInTheDocument();
		}
	);

	it( 'commits the day that was clicked', async () => {
		setSettings( {
			...originalSettings,
			timezone: {
				offset: -8,
				offsetFormatted: '-8',
				string: '',
				abbr: '',
			},
		} );
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

	it( 'shows and commits a date range on a site with a different timezone', async () => {
		setSettings( {
			...originalSettings,
			timezone: {
				offset: -8,
				offsetFormatted: '-8',
				string: '',
				abbr: '',
			},
		} );
		const user = userEvent.setup();

		render( <ControlledDateRangeDataForm /> );

		expect(
			screen.getByLabelText< HTMLInputElement >( 'From' ).value
		).toBe( '2026-08-20' );
		expect( screen.getByLabelText< HTMLInputElement >( 'To' ).value ).toBe(
			'2026-08-22'
		);

		const august25 = screen.getByRole( 'button', {
			name: /august 25, 2026/i,
		} );
		await user.click( august25 );
		// The first click extends the existing range. Clicking its new end again
		// starts the replacement range from that day.
		await user.click( august25 );
		await user.click(
			screen.getByRole( 'button', { name: /august 27, 2026/i } )
		);

		expect(
			screen.getByLabelText< HTMLInputElement >( 'From' ).value
		).toBe( '2026-08-25' );
		expect( screen.getByLabelText< HTMLInputElement >( 'To' ).value ).toBe(
			'2026-08-27'
		);
	} );

	it( 'anchors a plain date to the neutral UTC frame', () => {
		expect( parseDate( '2011-12-30' )?.toISOString() ).toBe(
			'2011-12-30T00:00:00.000Z'
		);
	} );

	// Date-only values now use the same neutral frame for every site setting;
	// this guards the named-timezone path as well as manual offsets.
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
} );

