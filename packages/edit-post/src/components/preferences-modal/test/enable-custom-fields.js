/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	default as EnableCustomFieldsOption,
	CustomFieldsConfirmation,
} from '../enable-custom-fields';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

function setupUseSelectMock( areCustomFieldsEnabled ) {
	useSelect.mockImplementation( () => {
		return areCustomFieldsEnabled;
	} );
}

describe( 'EnableCustomFieldsOption', () => {
	it( 'renders a checked checkbox when custom fields are enabled', () => {
		setupUseSelectMock( true );
		const { container } = render( <EnableCustomFieldsOption /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'renders an unchecked checkbox when custom fields are disabled', () => {
		setupUseSelectMock( false );
		const { container } = render( <EnableCustomFieldsOption /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'renders an unchecked checkbox and a confirmation message when toggled off', async () => {
		const user = userEvent.setup();

		setupUseSelectMock( true );
		const { container } = render( <EnableCustomFieldsOption /> );

		await user.click( screen.getByRole( 'checkbox' ) );

		expect( container ).toMatchSnapshot();
	} );

	it( 'renders a checked checkbox and a confirmation message when toggled on', async () => {
		const user = userEvent.setup();

		setupUseSelectMock( false );
		const { container } = render( <EnableCustomFieldsOption /> );

		await user.click( screen.getByRole( 'checkbox' ) );

		expect( container ).toMatchSnapshot();
	} );
} );

describe( 'CustomFieldsConfirmation', () => {
	it( 'submits the toggle-custom-fields-form', async () => {
		const user = userEvent.setup();
		const submit = jest.fn();
		const setAttribute = jest.fn();
		const getElementById = jest
			.spyOn( document, 'getElementById' )
			.mockImplementation( () => ( {
				submit,
				querySelector: () => ( { setAttribute } ),
			} ) );
		render( <CustomFieldsConfirmation /> );

		await user.click( screen.getByRole( 'button' ) );

		expect( getElementById ).toHaveBeenCalledWith(
			'toggle-custom-fields-form'
		);
		expect( setAttribute ).toHaveBeenCalledWith(
			'value',
			'/' // This is the path returned by getPathAndQueryString.
		);
		expect( submit ).toHaveBeenCalled();

		getElementById.mockRestore();
	} );
} );
