import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DateEdit from '../post_type_supports/date/edit';

// The date picker measures its layout.
globalThis.wpVitest.mockResizeObserver();

const field = {
	id: 'date',
	label: 'Date',
	type: 'datetime',
	getValue: ( { item }: { item: { date?: string | null } } ) => item.date,
	setValue: ( { value }: { value?: string } ) => ( { date: value ?? null } ),
	isDisabled: () => false,
} as any;

describe( 'DateEdit', () => {
	it( 'resets the date of a post to `null`', async () => {
		const onChange = vi.fn();
		render(
			<DateEdit
				data={ {
					status: 'publish',
					date: '2026-10-13T21:45:00',
					modified: '2026-10-20T10:00:00',
				} }
				field={ field }
				onChange={ onChange }
			/>
		);
		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Reset' } )
		);
		expect( onChange ).toHaveBeenCalledWith( { date: null } );
	} );

	it( 'disables the reset of a draft that publishes immediately', async () => {
		render(
			<DateEdit
				data={ {
					status: 'draft',
					date: '2026-10-20T10:00:00',
					modified: '2026-10-20T10:00:00',
				} }
				field={ field }
				onChange={ () => {} }
			/>
		);
		expect(
			await screen.findByRole( 'button', { name: 'Reset' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
