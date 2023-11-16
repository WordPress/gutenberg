/**
 * Internal dependencies
 */
import { wpKebabCase } from '../index';

describe( 'wpKebabCase', () => {
	it( 'should insert a dash between a letter and a digit', () => {
		const input = 'abc1def';
		const expectedOutput = 'abc-1def';
		expect( wpKebabCase( input ) ).toEqual( expectedOutput );
	} );

	it( 'should not insert a dash between two letters', () => {
		const input = 'abcdef';
		const expectedOutput = 'abcdef';
		expect( wpKebabCase( input ) ).toEqual( expectedOutput );
	} );

	it( 'should not insert a dash between a digit and a hyphen', () => {
		const input = 'abc1-def';
		const expectedOutput = 'abc-1-def';
		expect( wpKebabCase( input ) ).toEqual( expectedOutput );
	} );
} );
