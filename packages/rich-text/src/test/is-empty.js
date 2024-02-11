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

		expect( isEmpty( one ) ).toBe( false );
	} );
} );
