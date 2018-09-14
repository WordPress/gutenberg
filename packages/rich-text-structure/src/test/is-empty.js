/**
 * Internal dependencies
 */

import { isEmpty } from '../is-empty';

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
		const two = {
			formats: [
				[ { type: 'image' } ],
			],
			text: '',
		};

		expect( isEmpty( one ) ).toBe( false );
		expect( isEmpty( two ) ).toBe( false );
	} );
} );
