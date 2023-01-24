/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { PageAttributesOrder } from '../order';

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

		const onUpdateOrder = jest.fn();

		render( <PageAttributesOrder onUpdateOrder={ onUpdateOrder } /> );

		const input = screen.getByRole( 'spinbutton', { name: 'Order' } );
		await user.type( input, 'bad', typeOptions );
		await user.type( input, '----+++', typeOptions );
		await user.type( input, '-', typeOptions );
		await user.type( input, '+', typeOptions );
		await user.type( input, ' ', typeOptions );

		expect( onUpdateOrder ).not.toHaveBeenCalled();
	} );

	it( 'should update with zero input', async () => {
		const user = userEvent.setup();

		const onUpdateOrder = jest.fn();

		render(
			<PageAttributesOrder order={ 4 } onUpdateOrder={ onUpdateOrder } />
		);

		const input = screen.getByRole( 'spinbutton', { name: 'Order' } );

		await user.type( input, '0', typeOptions );

		expect( onUpdateOrder ).toHaveBeenCalledWith( 0 );
	} );

	it( 'should update with valid positive input', async () => {
		const user = userEvent.setup();

		const onUpdateOrder = jest.fn();

		render( <PageAttributesOrder onUpdateOrder={ onUpdateOrder } /> );

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Order' } ),
			'4',
			typeOptions
		);

		expect( onUpdateOrder ).toHaveBeenCalledWith( 4 );
	} );

	it( 'should update with valid negative input', async () => {
		const user = userEvent.setup();

		const onUpdateOrder = jest.fn();

		render( <PageAttributesOrder onUpdateOrder={ onUpdateOrder } /> );

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Order' } ),
			'-1',
			typeOptions
		);

		expect( onUpdateOrder ).toHaveBeenCalledWith( -1 );
	} );
} );
