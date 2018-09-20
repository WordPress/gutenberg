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
			formats: [ , , , , ],
			text: '\n\n\n\n',
			start: 2,
			end: 2,
		};
		const two = {
			formats: [ , , , , ],
			text: 'a\n\n\n\nb',
			start: 3,
			end: 3,
		};

		expect( isEmptyLine( one ) ).toBe( true );
		expect( isEmptyLine( two ) ).toBe( true );
	} );

	it( 'should return false', () => {
		const one = {
			formats: [],
			text: '',
			start: 0,
			end: 0,
		};
		const two = {
			formats: [ , , , , ],
			text: '\n\n\n\n',
			start: 3,
			end: 3,
		};
		const three = {
			formats: [ , , , , ],
			text: '\n\na\n\n',
			start: 2,
			end: 2,
		};
		const four = {
			formats: [ , , , , ],
			text: '\n\n\n',
			start: 2,
			end: 2,
		};

		expect( isEmptyLine( one ) ).toBe( false );
		expect( isEmptyLine( two ) ).toBe( false );
		expect( isEmptyLine( three ) ).toBe( false );
		expect( isEmptyLine( four ) ).toBe( false );
	} );
} );
