import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect, useDispatch } from '@wordpress/data';
import PageAttributesOrder from '../order';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
	useDispatch: vi.fn(),
} ) );

function setupDataMock( order = 0 ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getPostType: () => ( {
				supports: {
					'page-attributes': true,
				},
			} ),
			getEditedPostAttribute: ( attr ) => {
				switch ( attr ) {
					case 'menu_order':
						return order;
					default:
						return null;
				}
			},
		} ) )
	);

	const editPost = vi.fn();
	useDispatch.mockImplementation( () => ( {
		editPost,
	} ) );

	return editPost;
}

describe( 'PageAttributesOrder', () => {
	/**
	 * When starting to type inside the spinbutton, select the current value
	 * in order to override it with the new value afterwards.
	 */
	const typeOptions = {
		initialSelectionStart: 0,
		initialSelectionEnd: 1,
	};

	it( 'should reject invalid input', async () => {
		const user = userEvent.setup();

		const editPost = setupDataMock();

		render( <PageAttributesOrder /> );

		const input = screen.getByRole( 'spinbutton', { name: 'Order' } );
		await user.type( input, 'bad', typeOptions );
		await user.type( input, '----+++', typeOptions );
		await user.type( input, '-', typeOptions );
		await user.type( input, '+', typeOptions );
		await user.type( input, ' ', typeOptions );

		expect( editPost ).not.toHaveBeenCalled();
	} );

	it( 'should update with zero input', async () => {
		const user = userEvent.setup();

		const editPost = setupDataMock( 4 );

		render( <PageAttributesOrder /> );

		const input = screen.getByRole( 'spinbutton', { name: 'Order' } );

		await user.type( input, '0', typeOptions );

		expect( editPost ).toHaveBeenCalledWith( { menu_order: 0 } );
	} );

	it( 'should update with valid positive input', async () => {
		const user = userEvent.setup();

		const editPost = setupDataMock();

		render( <PageAttributesOrder /> );

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Order' } ),
			'4',
			typeOptions
		);

		expect( editPost ).toHaveBeenCalledWith( { menu_order: 4 } );
	} );

	it( 'should update with valid negative input', async () => {
		const user = userEvent.setup();

		const editPost = setupDataMock();

		render( <PageAttributesOrder /> );

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Order' } ),
			'-1',
			typeOptions
		);

		expect( editPost ).toHaveBeenCalledWith( { menu_order: -1 } );
	} );
} );
