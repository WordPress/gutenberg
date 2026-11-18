import { describe, expect, it } from 'vitest';
import { addFormatTypes, removeFormatTypes } from '../actions';
import type { FormatType } from '../../types';

describe( 'actions', () => {
	describe( 'addFormatTypes', () => {
		it( 'should cast format types as an array', () => {
			const formatTypes = { name: 'core/test-format' } as FormatType;
			const expected = {
				type: 'ADD_FORMAT_TYPES',
				formatTypes: [ formatTypes ],
			};

			expect( addFormatTypes( formatTypes ) ).toEqual( expected );
		} );
	} );

	describe( 'removeFormatTypes', () => {
		it( 'should cast format types as an array', () => {
			const names = 'core/test-format';
			const expected = {
				type: 'REMOVE_FORMAT_TYPES',
				names: [ names ],
			};

			expect( removeFormatTypes( names ) ).toEqual( expected );
		} );
	} );
} );
