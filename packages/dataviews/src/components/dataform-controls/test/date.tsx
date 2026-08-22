import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSettings, setSettings } from '@wordpress/date';
import { useState } from '@wordpress/element';
import normalizeFields from '../../../field-types';
import { OPERATOR_BETWEEN } from '../../../constants';
import DateControl from '../date';
import type { DataFormControlProps } from '../../../types';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const noop = () => {};

type TestItem = {
	published?: string | [ string, string ];
};

const field = normalizeFields< TestItem >( [
	{
		id: 'published',
		label: 'Published',
		type: 'date',
	},
] )[ 0 ];

const getMonthGrid = ( monthLabel: string ) =>
	screen.getByRole( 'grid', { name: monthLabel } );

const fullDateFormatter = new Intl.DateTimeFormat( 'en-US', {
	weekday: 'long',
	year: 'numeric',
	month: 'long',
	day: 'numeric',
} );

const getDayButton = ( date: Date ) =>
	screen.getByRole( 'button', {
		name: new RegExp( fullDateFormatter.format( date ) ),
	} );

function RangeHarness( {
	initialValue,
}: {
	initialValue: [ string, string ];
} ) {
	const [ data, setData ] = useState< TestItem >( {
		published: initialValue,
	} );
	const onChange: DataFormControlProps< TestItem >[ 'onChange' ] = (
		edits
	) => setData( ( current ) => ( { ...current, ...edits } ) as TestItem );
	return (
		<DateControl
			data={ data }
			field={ field }
			onChange={ onChange }
			operator={ OPERATOR_BETWEEN }
		/>
	);
}

describe( 'DateControl', () => {
	it( 'should move the calendar to the month of a value changed from outside the control', () => {
		const { rerender } = render(
			<DateControl
				data={ { published: '2024-03-15' } as TestItem }
				field={ field }
				onChange={ noop }
			/>
		);

		expect( getMonthGrid( 'March 2024' ) ).toBeInTheDocument();

		// External value change, e.g. an undo, a reset, or switching the
		// edited item.
		rerender(
			<DateControl
				data={ { published: '2024-11-15' } as TestItem }
				field={ field }
				onChange={ noop }
			/>
		);

		expect( getMonthGrid( 'November 2024' ) ).toBeInTheDocument();
	} );

	it( 'should keep the displayed month when the value is cleared from outside the control', () => {
		const { rerender } = render(
			<DateControl
				data={ { published: '2024-03-15' } as TestItem }
				field={ field }
				onChange={ noop }
			/>
		);

		rerender(
			<DateControl data={ {} } field={ field } onChange={ noop } />
		);

		expect( getMonthGrid( 'March 2024' ) ).toBeInTheDocument();
	} );

	describe( 'with the `between` operator', () => {
		it( 'should move the calendar to the start of a range changed from outside the control', () => {
			const { rerender } = render(
				<DateControl
					data={
						{
							published: [ '2024-03-10', '2024-03-20' ],
						} as TestItem
					}
					field={ field }
					onChange={ noop }
					operator={ OPERATOR_BETWEEN }
				/>
			);

			expect( getMonthGrid( 'March 2024' ) ).toBeInTheDocument();

			rerender(
				<DateControl
					data={
						{
							published: [ '2024-11-05', '2024-11-25' ],
						} as TestItem
					}
					field={ field }
					onChange={ noop }
					operator={ OPERATOR_BETWEEN }
				/>
			);

			expect( getMonthGrid( 'November 2024' ) ).toBeInTheDocument();
		} );

		it( 'should keep the displayed month while selecting the end of a cross-month range', async () => {
			const user = userEvent.setup();
			render(
				<RangeHarness initialValue={ [ '2024-03-10', '2024-03-12' ] } />
			);

			// Start a new range in the displayed month…
			await user.click( getDayButton( new Date( 2024, 2, 20 ) ) );
			// …navigate to the next month…
			await user.click(
				screen.getByRole( 'button', { name: /next month/i } )
			);
			expect( getMonthGrid( 'April 2024' ) ).toBeInTheDocument();

			// …and select the end of the range there. The view must not
			// jump back to the month of the range start.
			await user.click( getDayButton( new Date( 2024, 3, 1 ) ) );

			expect( getMonthGrid( 'April 2024' ) ).toBeInTheDocument();
		} );

		it( 'should keep the displayed month when it falls inside a range changed from outside the control', () => {
			const { rerender } = render(
				<DateControl
					data={
						{
							published: [ '2026-02-10', '2026-02-15' ],
						} as TestItem
					}
					field={ field }
					onChange={ noop }
					operator={ OPERATOR_BETWEEN }
				/>
			);

			rerender(
				<DateControl
					data={
						{
							published: [ '2026-01-10', '2026-03-20' ],
						} as TestItem
					}
					field={ field }
					onChange={ noop }
					operator={ OPERATOR_BETWEEN }
				/>
			);

			expect( getMonthGrid( 'February 2026' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'with a site time zone ahead of the browser', () => {
		let originalSettings: ReturnType< typeof getSettings >;

		beforeAll( () => {
			originalSettings = getSettings();
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

		afterAll( () => {
			setSettings( originalSettings );
		} );

		it( 'should move the calendar to the month of a value changed across a month boundary', () => {
			const { rerender } = render(
				<DateControl
					data={ { published: '2026-02-15' } as TestItem }
					field={ field }
					onChange={ noop }
				/>
			);

			expect( getMonthGrid( 'February 2026' ) ).toBeInTheDocument();

			// March 1 in the site time zone is still February in the
			// browser's, so a comparison in the wrong time zone keeps the
			// calendar on February and hides the selected day.
			rerender(
				<DateControl
					data={ { published: '2026-03-01' } as TestItem }
					field={ field }
					onChange={ noop }
				/>
			);

			expect( getMonthGrid( 'March 2026' ) ).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: /March 1, 2026/ } )
			).toBeInTheDocument();
		} );

		it( 'should move the calendar when a range changes across a month boundary', () => {
			const { rerender } = render(
				<DateControl
					data={
						{
							published: [ '2026-02-10', '2026-02-15' ],
						} as TestItem
					}
					field={ field }
					onChange={ noop }
					operator={ OPERATOR_BETWEEN }
				/>
			);

			expect( getMonthGrid( 'February 2026' ) ).toBeInTheDocument();

			rerender(
				<DateControl
					data={
						{
							published: [ '2026-03-01', '2026-03-05' ],
						} as TestItem
					}
					field={ field }
					onChange={ noop }
					operator={ OPERATOR_BETWEEN }
				/>
			);

			expect( getMonthGrid( 'March 2026' ) ).toBeInTheDocument();
		} );
	} );
} );
