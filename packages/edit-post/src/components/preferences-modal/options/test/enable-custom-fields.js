/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import {
	EnableCustomFieldsOption,
	CustomFieldsConfirmation,
} from '../enable-custom-fields';

describe( 'EnableCustomFieldsOption', () => {
	it( 'renders a checked checkbox when custom fields are enabled', () => {
		const { container } = render(
			<EnableCustomFieldsOption areCustomFieldsEnabled />
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'renders an unchecked checkbox when custom fields are disabled', () => {
		const { container } = render(
			<EnableCustomFieldsOption areCustomFieldsEnabled={ false } />
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'renders an unchecked checkbox and a confirmation message when toggled off', async () => {
		const user = userEvent.setup();

		const { container } = render(
			<EnableCustomFieldsOption areCustomFieldsEnabled />
		);

		await user.click( screen.getByRole( 'checkbox' ) );

		expect( container ).toMatchSnapshot();
	} );

	it( 'renders a checked checkbox and a confirmation message when toggled on', async () => {
		const user = userEvent.setup();

		const { container } = render(
			<EnableCustomFieldsOption areCustomFieldsEnabled={ false } />
		);

		await user.click( screen.getByRole( 'checkbox' ) );

		expect( container ).toMatchSnapshot();
	} );
} );

describe( 'CustomFieldsConfirmation', () => {
	it( 'submits the toggle-custom-fields-form', async () => {
		const user = userEvent.setup();
		const submit = jest.fn();
		const getElementById = jest
			.spyOn( document, 'getElementById' )
			.mockImplementation( () => ( {
				submit,
			} ) );

		render( <CustomFieldsConfirmation /> );

		await user.click( screen.getByRole( 'button' ) );

		expect( getElementById ).toHaveBeenCalledWith(
			'toggle-custom-fields-form'
		);
		expect( submit ).toHaveBeenCalled();

		getElementById.mockRestore();
	} );
} );
