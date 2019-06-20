/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HTMLInputView from '..';

// Utility to find a TextInput in a ShallowWrapper
const findTextInputInWrapper = ( wrapper, matchingProps ) => {
	return wrapper.dive().findWhere( ( node ) => {
		return node.name() === 'TextInput' && node.is( matchingProps );
	} ).first();
};

// Finds the Content TextInput in our HTMLInputView
const findContentTextInput = ( wrapper ) => {
	const placeholder = __( 'Start writing…' );
	const matchingProps = { multiline: true, placeholder };
	return findTextInputInWrapper( wrapper, matchingProps );
};

// Finds the Title TextInput in our HTMLInputView
const findTitleTextInput = ( wrapper ) => {
	const placeholder = __( 'Add title' );
	return findTextInputInWrapper( wrapper, { placeholder } );
};

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
		const htmlTextInput = findContentTextInput( wrapper );
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
		const htmlTextInput = findContentTextInput( wrapper );
		htmlTextInput.simulate( 'changeText', 'text' );

		//Simulate blur event
		htmlTextInput.simulate( 'blur' );

		//Normally prop.value is updated with the help of withSelect
		//But we don't have it in tests so we just simulate it
		wrapper.setProps( { value: 'text' } );

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
		const textInput = findTitleTextInput( wrapper );
		textInput.simulate( 'changeText', 'text' );

		//Check if the setTitleAction is called
		expect( setTitleAction ).toHaveBeenCalledTimes( 1 );
		expect( setTitleAction ).toHaveBeenCalledWith( 'text' );
	} );
} );

