import { render, screen } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
import normalizeFields from '../../../field-types';
import DateTime from '../datetime';

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

describe( 'DateTime control', () => {
	it( 'should move the calendar to the month of a value changed from outside the control', () => {
		const { rerender } = render(
			<DateTime
				data={ { published: '2024-03-15T10:30:00.000Z' } }
				field={ field }
				onChange={ noop }
			/>
		);

		expect(
			screen.getByRole( 'grid', { name: 'March 2024' } )
		).toBeInTheDocument();

		// External value change, e.g. an undo, a reset, or switching the
		// edited item.
		rerender(
			<DateTime
				data={ { published: '2024-11-20T10:30:00.000Z' } }
				field={ field }
				onChange={ noop }
			/>
		);

		expect(
			screen.getByRole( 'grid', { name: 'November 2024' } )
		).toBeInTheDocument();
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
				<DateTime
					data={ { published: '2026-02-15T10:00:00.000Z' } }
					field={ field }
					onChange={ noop }
				/>
			);

			expect(
				screen.getByRole( 'grid', { name: 'February 2026' } )
			).toBeInTheDocument();

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

			expect(
				screen.getByRole( 'grid', { name: 'March 2026' } )
			).toBeInTheDocument();
		} );
	} );
} );
