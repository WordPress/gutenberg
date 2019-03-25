/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { HTMLInputView } from '../components/html-text-input.js';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

describe( 'HTMLInputView', () => {
	it( 'HTMLInput renders', () => {
		const wrapper = shallow(
			<HTMLInputView />
		);
		expect( wrapper ).toBeTruthy();
	} );

	it( 'HTMLInputView updates store and state on HTML text change', () => {
		const onChange = jest.fn();

		const wrapper = shallow(
			<HTMLInputView
				onChange={ onChange }
			/>
		);

		expect( wrapper.instance().state.isDirty ).toBeFalsy();

		// Simulate user typing text
		const htmlTextInput = findHTMLTextInputFromWrapper( wrapper );
		htmlTextInput.simulate( 'changeText', 'text' );

		//Check if the onChange is called and the state is updated
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( 'text' );

		expect( wrapper.instance().state.isDirty ).toBeTruthy();
		expect( wrapper.instance().state.value ).toEqual( 'text' );
	} );

	it( 'HTMLInputView persists changes in HTML text input on blur', () => {
		const onPersist = jest.fn();

		const wrapper = shallow(
			<HTMLInputView
				onPersist={ onPersist }
				onChange={ jest.fn() }
			/>
		);

		// Simulate user typing text
		const htmlTextInput = findHTMLTextInputFromWrapper( wrapper );
		htmlTextInput.simulate( 'changeText', 'text' );

		//Simulate blur event
		htmlTextInput.simulate( 'blur' );
		
		//Normally prop.value is updated with the help of withSelect
		//But we don't have it in tests so we just simulate it
		wrapper.setProps( { value: "text" } );
		
		//Check if the onPersist is called and the state is updated
		expect( onPersist ).toHaveBeenCalledTimes( 1 );
		expect( onPersist ).toHaveBeenCalledWith( 'text' );

		expect( wrapper.instance().state.isDirty ).toBeFalsy();

		//We expect state.value is getting propagated from prop.value
		expect( wrapper.instance().state.value ).toEqual( 'text' );
	} );

	it( 'HTMLInputView propagates title changes to store', () => {
		const setTitleAction = jest.fn();

		const wrapper = shallow(
			<HTMLInputView
				setTitleAction={ setTitleAction }
			/>
		);

		// Simulate user typing text
		const textInput = findTitleTextInputFromWrapper( wrapper );
		textInput.simulate( 'changeText', 'text' );

		//Check if the setTitleAction is called
		expect( setTitleAction ).toHaveBeenCalledTimes( 1 );
		expect( setTitleAction ).toHaveBeenCalledWith( 'text' );
	} );
} );

// Utility to find the HTML TextInput from the wrapper
const findHTMLTextInputFromWrapper = ( wrapper ) => {
	const placeholder = __( 'Start writing…' );
	return wrapper.dive().find( { multiline: true, placeholder } ).first();
};

// Utility to find the Title TextInput from the wrapper
const findTitleTextInputFromWrapper = ( wrapper ) => {
	const placeholder = __( 'Add title' );
	return wrapper.dive().find( { placeholder } ).first();
};
