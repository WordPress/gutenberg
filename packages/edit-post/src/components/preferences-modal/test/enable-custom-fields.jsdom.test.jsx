import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useSelect } from '@wordpress/data';
import {
	default as EnableCustomFieldsOption,
	CustomFieldsConfirmation,
} from '../enable-custom-fields';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

function setupUseSelectMock( areCustomFieldsEnabled ) {
	useSelect.mockImplementation( () => {
		return areCustomFieldsEnabled;
	} );
}

describe( 'EnableCustomFieldsOption', () => {
	it( 'renders a checked checkbox when custom fields are enabled', () => {
		setupUseSelectMock( true );
		render( <EnableCustomFieldsOption /> );

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
	} );

	it( 'renders an unchecked checkbox when custom fields are disabled', () => {
		setupUseSelectMock( false );
		render( <EnableCustomFieldsOption /> );

		expect( screen.getByRole( 'checkbox' ) ).not.toBeChecked();
	} );

	it( 'renders an unchecked checkbox and a confirmation message when toggled off', async () => {
		const user = userEvent.setup();

		setupUseSelectMock( true );
		render( <EnableCustomFieldsOption /> );

		await user.click( screen.getByRole( 'checkbox' ) );

		expect( screen.getByRole( 'checkbox' ) ).not.toBeChecked();
		expect(
			screen.getByText( /A page reload is required/ )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Hide & Reload Page' } )
		).toBeInTheDocument();
	} );

	it( 'renders a checked checkbox and a confirmation message when toggled on', async () => {
		const user = userEvent.setup();

		setupUseSelectMock( false );
		render( <EnableCustomFieldsOption /> );

		await user.click( screen.getByRole( 'checkbox' ) );

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
		expect(
			screen.getByText( /A page reload is required/ )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Show & Reload Page' } )
		).toBeInTheDocument();
	} );
} );

describe( 'CustomFieldsConfirmation', () => {
	it( 'submits the toggle-custom-fields-form', async () => {
		const user = userEvent.setup();
		const submit = vi.fn();
		const setAttribute = vi.fn();
		const getElementById = vi
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
