/**
 * Internal dependencies
 */

import { isEmpty, isEmptyLine } from '../is-empty';

describe( 'isEmpty', () => {
	it( 'should return true', () => {
		const one = {
			formats: [],
			text: '',
		};

		expect( isEmpty( one ) ).toBe( true );
	} );

	it( 'should return false', () => {
		const one = {
			formats: [],
			text: 'test',
		};

		expect( isEmpty( one ) ).toBe( false );
	} );
} );

describe( 'isEmptyLine', () => {
	it( 'should return true', () => {
		const one = {
			formats: [],
			text: '',
			start: 0,
			end: 0,
		};
		const two = {
			formats: [ , , ],
			text: '\u2028',
			start: 0,
			end: 0,
		};
		const three = {
			formats: [ , , ],
			text: '\u2028',
			start: 1,
			end: 1,
		};
		const four = {
			formats: [ , , , , ],
			text: '\u2028\u2028',
			start: 1,
			end: 1,
		};
		const five = {
			formats: [ , , , , ],
			text: 'a\u2028\u2028b',
			start: 2,
			end: 2,
		};

		expect( isEmptyLine( one ) ).toBe( true );
		expect( isEmptyLine( two ) ).toBe( true );
		expect( isEmptyLine( three ) ).toBe( true );
		expect( isEmptyLine( four ) ).toBe( true );
		expect( isEmptyLine( five ) ).toBe( true );
	} );

	it( 'should return false', () => {
		const one = {
			formats: [ , , , , ],
			text: '\u2028a\u2028',
			start: 1,
			end: 1,
		};
		const two = {
			formats: [ , , , , ],
			text: '\u2028\n',
			start: 1,
			end: 1,
		};

		expect( isEmptyLine( one ) ).toBe( false );
		expect( isEmptyLine( two ) ).toBe( false );
	} );
} );
