/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { split } from '../split';
import { getSparseArrayLength } from './helpers';

describe( 'split', () => {
	const em = { type: 'em' };

	it( 'should split', () => {
		const record = {
			start: 5,
			end: 10,
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			replacements: new Array( 13 ),
			text: 'one two three',
		};
		const expected = [
			{
				formats: [ , , , , [ em ], [ em ] ],
				replacements: new Array( 6 ),
				text: 'one tw',
			},
			{
				start: 0,
				end: 0,
				formats: [ [ em ], , , , , , , ],
				replacements: new Array( 7 ),
				text: 'o three',
			},
		];
		const result = split( deepFreeze( record ), 6, 6 );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) )
				.toBe( getSparseArrayLength( expected[ index ].formats ) );
		} );
	} );

	it( 'should split with selection', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			replacements: new Array( 13 ),
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const expected = [
			{
				formats: [ , , , , [ em ], [ em ] ],
				replacements: new Array( 6 ),
				text: 'one tw',
			},
			{
				formats: [ [ em ], , , , , , , ],
				replacements: new Array( 7 ),
				text: 'o three',
				start: 0,
				end: 0,
			},
		];
		const result = split( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) )
				.toBe( getSparseArrayLength( expected[ index ].formats ) );
		} );
	} );

	it( 'should split empty', () => {
		const record = {
			formats: [],
			replacements: [],
			text: '',
			start: 0,
			end: 0,
		};
		const expected = [
			{
				formats: [],
				replacements: [],
				text: '',
			},
			{
				formats: [],
				replacements: [],
				text: '',
				start: 0,
				end: 0,
			},
		];
		const result = split( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) )
				.toBe( getSparseArrayLength( expected[ index ].formats ) );
		} );
	} );

	it( 'should split multiline', () => {
		const record = {
			formats: [ , , , , , , , , , , ],
			replacements: new Array( 10 ),
			text: 'test\u2028\u2028test',
			start: 5,
			end: 5,
		};
		const expected = [
			{
				formats: [ , , , , ],
				replacements: new Array( 4 ),
				text: 'test',
			},
			{
				formats: [ , , , , ],
				replacements: new Array( 4 ),
				text: 'test',
				start: 0,
				end: 0,
			},
		];
		const result = split( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) )
				.toBe( getSparseArrayLength( expected[ index ].formats ) );
		} );
	} );

	it( 'should split search', () => {
		const record = {
			start: 6,
			end: 16,
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , , , , , , , , , , , ],
			replacements: new Array( 23 ),
			text: 'one two three four five',
		};
		const expected = [
			{
				formats: [ , , , ],
				replacements: new Array(3 ),
				text: 'one',
			},
			{
				start: 2,
				end: 3,
				formats: [ [ em ], [ em ], [ em ] ],
				replacements: new Array( 3 ),
				text: 'two',
			},
			{
				start: 0,
				end: 5,
				formats: [ , , , , , ],
				replacements: new Array( 5 ),
				text: 'three',
			},
			{
				start: 0,
				end: 2,
				formats: [ , , , , ],
				replacements: new Array( 4 ),
				text: 'four',
			},
			{
				formats: [ , , , , ],
				replacements: new Array( 4 ),
				text: 'five',
			},
		];
		const result = split( deepFreeze( record ), ' ' );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) )
				.toBe( getSparseArrayLength( expected[ index ].formats ) );
		} );
	} );

	it( 'should split search 2', () => {
		const record = {
			start: 5,
			end: 6,
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			replacements: new Array( 13 ),
			text: 'one two three',
		};
		const expected = [
			{
				formats: [ , , , ],
				replacements: new Array( 3 ),
				text: 'one',
			},
			{
				start: 1,
				end: 2,
				formats: [ [ em ], [ em ], [ em ] ],
				replacements: new Array( 3 ),
				text: 'two',
			},
			{
				formats: [ , , , , , ],
				replacements: new Array( 5 ),
				text: 'three',
			},
		];
		const result = split( deepFreeze( record ), ' ' );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) )
				.toBe( getSparseArrayLength( expected[ index ].formats ) );
		} );
	} );
} );
