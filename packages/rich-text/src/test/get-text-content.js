import { getTextContent } from '../get-text-content';
import { OBJECT_REPLACEMENT_CHARACTER } from '../special-characters';

describe( 'getTextContent', () => {
	it( 'should return the text as is when it holds no objects', () => {
		expect( getTextContent( { text: 'one two' } ) ).toBe( 'one two' );
	} );

	it( 'should remove a single object replacement character', () => {
		expect(
			getTextContent( { text: `a${ OBJECT_REPLACEMENT_CHARACTER }b` } )
		).toBe( 'ab' );
	} );

	it( 'should remove every object replacement character', () => {
		expect(
			getTextContent( {
				text: `a${ OBJECT_REPLACEMENT_CHARACTER }b${ OBJECT_REPLACEMENT_CHARACTER }c`,
			} )
		).toBe( 'abc' );
	} );
} );
