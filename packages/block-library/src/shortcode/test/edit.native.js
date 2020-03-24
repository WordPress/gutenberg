/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import Shortcode from '../edit';
import { TextInput } from 'react-native';

describe( 'Shortcode', () => {
	it( 'renders without crashing', () => {
		const component = renderer.create(
			<Shortcode attributes={ { text: '' } } />
		);
		const rendered = component.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'renders given text without crashing', () => {
		const component = renderer.create(
			<Shortcode
				attributes={ {
					text:
						'[youtube https://www.youtube.com/watch?v=ssfHW5lwFZg]',
				} }
			/>
		);
		const testInstance = component.root;
		const textInput = testInstance.findByType( TextInput );
		expect( textInput ).toBeTruthy();
		expect( textInput.props.value ).toBe(
			'[youtube https://www.youtube.com/watch?v=ssfHW5lwFZg]'
		);
	} );
} );
