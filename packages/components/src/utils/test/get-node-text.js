/**
 * Internal dependencies
 */
import getNodeText from '../get-node-text';

describe( 'getNodeText', () => {
	it( 'should return an empty string for null', () => {
		expect( getNodeText( null ) ).toBe( '' );
	} );

	it( 'should return the string representation of a string node', () => {
		expect( getNodeText( 'Hello' ) ).toBe( 'Hello' );
	} );

	it( 'should return the string representation of a number node', () => {
		expect( getNodeText( 123 ) ).toBe( '123' );
	} );

	it( 'should return an empty string for a boolean node', () => {
		expect( getNodeText( true ) ).toBe( '' );
	} );

	it( 'should concatenate text from an array of nodes', () => {
		expect( getNodeText( [ 'Hello', ' ', 'World' ] ) ).toBe(
			'Hello World'
		);
	} );

	it( 'should return text from a React element with children', () => {
		const element = (
			<div>
				Hello <span>World</span>
			</div>
		);
		expect( getNodeText( element ) ).toBe( 'Hello World' );
	} );
} );
