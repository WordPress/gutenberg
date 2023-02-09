/**
 * External dependencies
 */
import { measurePerformance } from 'reassure';
import { fireEvent } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import { HTMLTextInput } from '..';

// Finds the Content TextInput in our HTMLInputView.
const findContentTextInput = ( screen ) => {
	return screen.getByLabelText( 'html-view-content' );
};

describe( 'HTMLTextInput Performance', () => {
	it( 'measures performance', async () => {
		const onChange = jest.fn();

		const scenario = async ( screen ) => {
			// Simulate user typing text.
			const htmlTextInput = findContentTextInput( screen );
			fireEvent( htmlTextInput, 'changeText', 'text' );

			// Check if the onChange is called and the state is updated.
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( 'text' );

			expect( screen.getByDisplayValue( 'text' ) ).toBeTruthy();
		};

		await measurePerformance(
			<HTMLTextInput
				getStylesFromColorScheme={ jest.fn() }
				onChange={ onChange }
				onPersist={ jest.fn() }
			/>,
			{ scenario }
		);
	} );
} );
