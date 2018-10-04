/**
 * Internal dependencies
 */

import { isEmpty, isEmptyLine } from '../is-empty';

describe( 'isEmpty', () => {
	it( 'should return true', () => {
		const one = {
			_formats: [],
			_text: '',
		};

		expect( isEmpty( one ) ).toBe( true );
	} );

	it( 'should return false', () => {
		const one = {
			_formats: [],
			_text: 'test',
		};

		expect( isEmpty( one ) ).toBe( false );
	} );
} );

describe( 'isEmptyLine', () => {
	it( 'should return true', () => {
		const one = {
			_formats: [],
			_text: '',
			_start: 0,
			_end: 0,
		};
		const two = {
			_formats: [ , , ],
			_text: '\u2028',
			_start: 0,
			_end: 0,
		};
		const three = {
			_formats: [ , , ],
			_text: '\u2028',
			_start: 1,
			_end: 1,
		};
		const four = {
			_formats: [ , , , , ],
			_text: '\u2028\u2028',
			_start: 1,
			_end: 1,
		};
		const five = {
			_formats: [ , , , , ],
			_text: 'a\u2028\u2028b',
			_start: 2,
			_end: 2,
		};

		expect( isEmptyLine( one ) ).toBe( true );
		expect( isEmptyLine( two ) ).toBe( true );
		expect( isEmptyLine( three ) ).toBe( true );
		expect( isEmptyLine( four ) ).toBe( true );
		expect( isEmptyLine( five ) ).toBe( true );
	} );

	it( 'should return false', () => {
		const one = {
			_formats: [ , , , , ],
			_text: '\u2028a\u2028',
			_start: 1,
			_end: 1,
		};
		const two = {
			_formats: [ , , , , ],
			_text: '\u2028\n',
			_start: 1,
			_end: 1,
		};

		expect( isEmptyLine( one ) ).toBe( false );
		expect( isEmptyLine( two ) ).toBe( false );
	} );
} );
