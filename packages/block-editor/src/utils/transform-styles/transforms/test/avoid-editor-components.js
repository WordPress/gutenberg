/**
 * Internal dependencies
 */
import traverse from '../../traverse';
import avoidEditorComponents from '../avoid-editor-components';

describe( 'CSS selector wrap', () => {
	it( 'should replace add editor classes to buttons', () => {
		const callback = avoidEditorComponents();
		const input = `
		button {
			background-color: #ff0000;
		}`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should replace add editor classes to inputs', () => {
		const callback = avoidEditorComponents();
		const input = `
		input {
			border-color: #ff0000;
		}`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );
} );
