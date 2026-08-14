import { render, screen } from '@testing-library/react';
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
} );
