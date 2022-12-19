/**
 * External dependencies
 */
import { render, fireEvent } from 'test/helpers';

/**
 * Internal dependencies
 */
import { HTMLTextInput } from '..';

// Finds the Content TextInput in our HTMLInputView.
const findContentTextInput = ( screen ) => {
	return screen.getByLabelText( 'html-view-content' );
};

// Finds the Title TextInput in our HTMLInputView.
const findTitleTextInput = ( screen ) => {
	return screen.getByLabelText( 'html-view-title' );
};

const getStylesFromColorScheme = () => {
	return { color: 'white' };
};

describe( 'HTMLTextInput', () => {
	it( 'HTMLTextInput renders', () => {
		const screen = render(
			<HTMLTextInput
				getStylesFromColorScheme={ getStylesFromColorScheme }
			/>
		);
		expect( screen.container ).toBeTruthy();
	} );

	it( 'HTMLTextInput updates state on HTML text change', () => {
		const onChange = jest.fn();

		const screen = render(
			<HTMLTextInput
				onChange={ onChange }
				onPersist={ jest.fn() }
				getStylesFromColorScheme={ getStylesFromColorScheme }
			/>
		);

		// Simulate user typing text.
		const htmlTextInput = findContentTextInput( screen );
		fireEvent( htmlTextInput, 'changeText', 'text' );

		// Check if the onChange is called and the state is updated.
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( 'text' );

		expect( screen.getByDisplayValue( 'text' ) ).toBeDefined();
	} );

	it( 'HTMLTextInput persists changes in HTML text input on blur', () => {
		const onPersist = jest.fn();

		const screen = render(
			<HTMLTextInput
				onPersist={ onPersist }
				onChange={ jest.fn() }
				getStylesFromColorScheme={ getStylesFromColorScheme }
			/>
		);

		// Simulate user typing text.
		const htmlTextInput = findContentTextInput( screen );
		fireEvent( htmlTextInput, 'changeText', 'text' );

		//Simulate blur event.
		fireEvent( htmlTextInput, 'blur' );

		// Normally prop.value is updated with the help of withSelect
		// but we don't have it in tests so we just simulate it.
		screen.update(
			<HTMLTextInput
				onPersist={ onPersist }
				onChange={ jest.fn() }
				getStylesFromColorScheme={ getStylesFromColorScheme }
				value="text"
			/>
		);

		// Check if the onPersist is called and the state is updated.
		expect( onPersist ).toHaveBeenCalledTimes( 1 );
		expect( onPersist ).toHaveBeenCalledWith( 'text' );

		//Simulate blur event.
		fireEvent( htmlTextInput, 'blur' );

		// Check that onPersist is not called for non-dirty state.
		expect( onPersist ).toHaveBeenCalledTimes( 1 );

		// We expect state.value is getting propagated from prop.value.
		expect( screen.getByDisplayValue( 'text' ) ).toBeDefined();
	} );

	it( 'HTMLTextInput propagates title changes to store', () => {
		const editTitle = jest.fn();

		const screen = render(
			<HTMLTextInput
				editTitle={ editTitle }
				getStylesFromColorScheme={ getStylesFromColorScheme }
			/>
		);

		// Simulate user typing text.
		const textInput = findTitleTextInput( screen );
		fireEvent( textInput, 'changeText', 'text' );

		// Check if the setTitleAction is called.
		expect( editTitle ).toHaveBeenCalledTimes( 1 );
		expect( editTitle ).toHaveBeenCalledWith( 'text' );
	} );
} );
