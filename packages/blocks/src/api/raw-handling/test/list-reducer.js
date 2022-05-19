/**
 * Internal dependencies
 */
import listReducer from '../list-reducer';
import { deepFilterHTML } from '../utils';

describe( 'listReducer', () => {
	it( 'should merge lists', () => {
		const input = '<ul><li>one</li></ul><ul><li>two</li></ul>';
		const output = '<ul><li>one</li><li>two</li></ul>';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( output );
	} );

	it( 'should merge lists with whitespace', () => {
		const input = '<ul>\n<li>one</li>\n</ul>\n<ul>\n<li>two</li>\n</ul>';
		const output = '<ul>\n<li>one</li>\n\n<li>two</li>\n</ul>\n';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( output );
	} );

	it( 'should not merge lists if it has more than one item', () => {
		const input =
			'<ul><li>one</li></ul><ul><li>two</li><li>three</li></ul>';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( input );
	} );

	it( 'should not merge list if the type is different', () => {
		const input = '<ul><li>one</li></ul><ol><li>two</li></ol>';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( input );
	} );

	it( 'should not merge lists if there is something in between', () => {
		const input = '<ul><li>one</li></ul><p></p><ul><li>two</li></ul>';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( input );
	} );

	it( 'should merge list items if nested list parent has no content', () => {
		const input =
			'<ul><li>1</li><li><ul><li>1.1</li><li>1.2</li></ul></li><li>2</li></ul>';
		const output =
			'<ul><li>1<ul><li>1.1</li><li>1.2</li></ul></li><li>2</li></ul>';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( output );
	} );

	it( 'should remove empty list wrappers', () => {
		const input = '<ul><li>\n<ul><li>test</li></ul>\n</li></ul>';
		const output = '<ul><li>test</li></ul>';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( output );
	} );

	it( 'should not remove filled list wrappers', () => {
		const input = '<ul><li>\ntest\n<ul><li>test</li></ul>\n</li></ul>';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( input );
	} );

	it( 'should adjust wrong indentation (1)', () => {
		const input = '<ul><li>test</li><ul><li>test</li></ul></ul>';
		const output = '<ul><li>test<ul><li>test</li></ul></li></ul>';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( output );
	} );

	it( 'should adjust wrong indentation (2)', () => {
		const input = '<ul><ul><li>test</li></ul><li>test</li></ul>';
		const output = '<ul><li>test</li><li>test</li></ul>';
		expect( deepFilterHTML( input, [ listReducer ] ) ).toEqual( output );
	} );
} );
