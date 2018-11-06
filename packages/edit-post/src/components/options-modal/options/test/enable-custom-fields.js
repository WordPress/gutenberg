/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { EnableCustomFieldsOption } from '../enable-custom-fields';

describe( 'EnableCustomFieldsOption', () => {
	it( 'renders properly when checked', () => {
		const wrapper = shallow( <EnableCustomFieldsOption label="Custom Fields" isChecked /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'can be unchecked', () => {
		const submit = jest.fn();
		const getElementById = jest.spyOn( document, 'getElementById' ).mockImplementation( () => ( {
			submit,
		} ) );

		const wrapper = shallow( <EnableCustomFieldsOption label="Custom Fields" isChecked /> );

		expect( wrapper.prop( 'isChecked' ) ).toBe( true );

		wrapper.prop( 'onChange' )();
		wrapper.update();

		expect( wrapper.prop( 'isChecked' ) ).toBe( false );
		expect( getElementById ).toHaveBeenCalledWith( 'toggle-custom-fields-form' );
		expect( submit ).toHaveBeenCalled();

		getElementById.mockRestore();
	} );

	it( 'renders properly when unchecked', () => {
		const wrapper = shallow(
			<EnableCustomFieldsOption label="Custom Fields" isChecked={ false } />
		);
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'can be checked', () => {
		const submit = jest.fn();
		const getElementById = jest.spyOn( document, 'getElementById' ).mockImplementation( () => ( {
			submit,
		} ) );

		const wrapper = shallow(
			<EnableCustomFieldsOption label="Custom Fields" isChecked={ false } />
		);

		expect( wrapper.prop( 'isChecked' ) ).toBe( false );

		wrapper.prop( 'onChange' )();
		wrapper.update();

		expect( wrapper.prop( 'isChecked' ) ).toBe( true );
		expect( getElementById ).toHaveBeenCalledWith( 'toggle-custom-fields-form' );
		expect( submit ).toHaveBeenCalled();

		getElementById.mockRestore();
	} );
} );
