/**
 * External dependencies
 */
import { default as TestRenderer, act } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { ___unstablePreferencesModalBaseOption as BaseOption } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import {
	EnableCustomFieldsOption,
	CustomFieldsConfirmation,
} from '../enable-custom-fields';

describe( 'EnableCustomFieldsOption', () => {
	it( 'renders a checked checkbox when custom fields are enabled', () => {
		const renderer = TestRenderer.create(
			<EnableCustomFieldsOption areCustomFieldsEnabled />
		);
		expect( renderer ).toMatchSnapshot();
	} );

	it( 'renders an unchecked checkbox when custom fields are disabled', () => {
		const renderer = TestRenderer.create(
			<EnableCustomFieldsOption areCustomFieldsEnabled={ false } />
		);
		expect( renderer ).toMatchSnapshot();
	} );

	it( 'renders an unchecked checkbox and a confirmation message when toggled off', () => {
		const renderer = new TestRenderer.create(
			<EnableCustomFieldsOption areCustomFieldsEnabled />
		);
		act( () => {
			renderer.root.findByType( BaseOption ).props.onChange( false );
		} );
		expect( renderer ).toMatchSnapshot();
	} );

	it( 'renders a checked checkbox and a confirmation message when toggled on', () => {
		const renderer = new TestRenderer.create(
			<EnableCustomFieldsOption areCustomFieldsEnabled={ false } />
		);
		act( () => {
			renderer.root.findByType( BaseOption ).props.onChange( true );
		} );
		expect( renderer ).toMatchSnapshot();
	} );
} );

describe( 'CustomFieldsConfirmation', () => {
	it( 'submits the toggle-custom-fields-form', () => {
		const submit = jest.fn();
		const getElementById = jest
			.spyOn( document, 'getElementById' )
			.mockImplementation( () => ( {
				submit,
			} ) );

		const renderer = new TestRenderer.create(
			<CustomFieldsConfirmation />
		);
		act( () => {
			renderer.root.findByType( Button ).props.onClick();
		} );

		expect( getElementById ).toHaveBeenCalledWith(
			'toggle-custom-fields-form'
		);
		expect( submit ).toHaveBeenCalled();

		getElementById.mockRestore();
	} );
} );
