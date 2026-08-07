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
} );
