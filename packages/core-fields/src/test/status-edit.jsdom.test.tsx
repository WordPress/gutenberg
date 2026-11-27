import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StatusEdit from '../post_type_supports/status/edit';
import { fieldExtensions } from '../post_type_supports/status/field';
import StatusView from '../post_type_supports/status/view';
import type { PostWithStatus } from '../post_type_supports/status/types';

const elements = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'publish', label: 'Published' },
	{ value: 'trash', label: 'Trash' },
];

const field = {
	id: 'status',
	label: 'Status',
	elements,
	getValue: fieldExtensions.getValue!,
	setValue: fieldExtensions.setValue!,
	isDisabled: fieldExtensions.isDisabled!,
} as any;

const post: PostWithStatus = {
	status: 'draft',
	_links: { 'wp:action-publish': [ { href: '' } ] },
};

describe( 'StatusEdit', () => {
	it( 'offers every status but the trash', () => {
		render(
			<StatusEdit field={ field } data={ post } onChange={ vi.fn() } />
		);
		expect( screen.getAllByRole( 'radio' ) ).toHaveLength( 2 );
		expect(
			screen.getByRole( 'radio', { name: 'Published' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'radio', { name: 'Trash' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Draft' } ) ).toBeChecked();
	} );

	it( 'sends the change through the field', () => {
		const onChange = vi.fn();
		render(
			<StatusEdit field={ field } data={ post } onChange={ onChange } />
		);
		fireEvent.click( screen.getByRole( 'radio', { name: 'Published' } ) );
		expect( onChange ).toHaveBeenCalledWith( { status: 'publish' } );
	} );

	it( 'is disabled for a user who cannot publish', () => {
		render(
			<StatusEdit
				field={ field }
				data={ { status: 'draft', _links: {} } }
				onChange={ vi.fn() }
			/>
		);
		for ( const radio of screen.getAllByRole( 'radio' ) ) {
			expect( radio ).toHaveAttribute( 'aria-disabled', 'true' );
		}
	} );
} );

describe( 'StatusView', () => {
	it( 'still labels a trashed post', () => {
		render( <StatusView field={ field } item={ { status: 'trash' } } /> );
		expect( screen.getByText( 'Trash' ) ).toBeInTheDocument();
	} );
} );
