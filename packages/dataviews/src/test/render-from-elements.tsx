/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import renderFromElements from '../field-types/utils/render-from-elements';
import type { NormalizedField } from '../types';

type Item = { status: string };

function createField(
	elements: NormalizedField< Item >[ 'elements' ],
	value: string
): NormalizedField< Item > {
	return {
		id: 'status',
		label: 'Status',
		header: 'Status',
		type: 'text',
		description: undefined,
		filterBy: false,
		readOnly: false,
		isValid: {},
		sort: () => 0,
		render: () => null,
		Edit: null,
		setValue: () => ( { status: value } ),
		getValue: () => value,
		elements,
		enableSorting: true,
		enableHiding: true,
		enableGlobalSearch: true,
	} as unknown as NormalizedField< Item >;
}

describe( 'renderFromElements', () => {
	it( 'renders async options returned by a function', async () => {
		const field = createField(
			() =>
				Promise.resolve( [
					{ value: 'pending', label: 'Pending Approval' },
				] ),
			'pending'
		);
		const item = { status: 'pending' };

		render(
			<div data-testid="value">
				{ renderFromElements( { item, field } ) }
			</div>
		);

		await waitFor( () => {
			expect( screen.getByTestId( 'value' ) ).toHaveTextContent(
				'Pending Approval'
			);
		} );
	} );

	it( 'renders async options provided as a promise', async () => {
		const field = createField(
			Promise.resolve( [ { value: 'approved', label: 'Approved' } ] ),
			'approved'
		);
		const item = { status: 'approved' };

		render(
			<div data-testid="value">
				{ renderFromElements( { item, field } ) }
			</div>
		);

		await waitFor( () => {
			expect( screen.getByTestId( 'value' ) ).toHaveTextContent(
				'Approved'
			);
		} );
	} );
} );
