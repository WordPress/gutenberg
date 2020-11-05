/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import Code from '../edit';
import { TextInput } from 'react-native';

describe( 'Code', () => {
	it( 'renders without crashing', () => {
		const component = renderer.create(
			<Code attributes={ { content: '' } } />
		);
		const rendered = component.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'renders given text without crashing', () => {
		const component = renderer.create(
			<Code attributes={ { content: 'sample text' } } />
		);
		const testInstance = component.root;
		const textInput = testInstance.findByType( TextInput );
		expect( textInput ).toBeTruthy();
		expect( textInput.props.value ).toBe( 'sample text' );
	} );
} );
