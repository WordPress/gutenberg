/**
 * Internal dependencies
 */

import { isFormatEqual } from '../is-format-equal';

describe( 'isFormatEqual', () => {
	const spec = [
		{
			format1: undefined,
			format2: undefined,
			isEqual: true,
			description: 'should return true if both are undefined',
		},
		{
			format1: {},
			format2: undefined,
			isEqual: false,
			description: 'should return false if one is undefined',
		},
		{
			format1: { type: 'bold' },
			format2: { type: 'bold' },
			isEqual: true,
			description: 'should return true if both have same type',
		},
		{
			format1: { type: 'bold' },
			format2: { type: 'italic' },
			isEqual: false,
			description: 'should return false if one has different type',
		},
		{
			format1: { type: 'bold', attributes: {} },
			format2: { type: 'bold' },
			isEqual: false,
			description: 'should return false if one has undefined attributes',
		},
		{
			format1: { type: 'bold', attributes: { a: '1' } },
			format2: { type: 'bold', attributes: { a: '1' } },
			isEqual: true,
			description: 'should return true if both have same attributes',
		},
		{
			format1: { type: 'bold', attributes: { a: '1' } },
			format2: { type: 'bold', attributes: { b: '1' } },
			isEqual: false,
			description: 'should return false if one has different attributes',
		},
		{
			format1: { type: 'bold', attributes: { a: '1' } },
			format2: { type: 'bold', attributes: { a: '1', b: '1' } },
			isEqual: false,
			description:
				'should return false if one has a different amount of attributes',
		},
		{
			format1: { type: 'bold', attributes: { b: '1', a: '1' } },
			format2: { type: 'bold', attributes: { a: '1', b: '1' } },
			isEqual: true,
			description:
				'should return true both have same attributes but different order',
		},
	];

	spec.forEach( ( { format1, format2, isEqual, description } ) => {
		// eslint-disable-next-line jest/valid-title
		it( description, () => {
			expect( isFormatEqual( format1, format2 ) ).toBe( isEqual );
		} );
	} );
} );
