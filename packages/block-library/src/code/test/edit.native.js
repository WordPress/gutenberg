/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import Code from '../edit';

describe( 'Code', () => {
	it( 'renders without crashing', () => {
		const component = renderer.create( <Code attributes={ { content: '' } } /> );
		const rendered = component.toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'renders given text without crashing', () => {
		const component = renderer.create( <Code attributes={ { content: 'sample text' } } /> );
		const testInstance = component.root;
		const textInput = testInstance.findByType( PlainText );
		expect( textInput ).toBeTruthy();
		expect( textInput.props.value ).toBe( 'sample text' );
	} );
} );
