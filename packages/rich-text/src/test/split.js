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
			lineFormats: [ , , , , , , , , , , , , , ],
			objects: [ , , , , , , , , , , , , , ],
			text: 'one two three',
		};
		const expected = [
			{
				formats: [ , , , , [ em ], [ em ] ],
				lineFormats: [ , , , , , , ],
				objects: [ , , , , , , ],
				text: 'one tw',
			},
			{
				start: 0,
				end: 0,
				formats: [ [ em ], , , , , , , ],
				lineFormats: [ , , , , , , , ],
				objects: [ , , , , , , , ],
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
			lineFormats: [ , , , , , , , , , , , , , ],
			objects: [ , , , , , , , , , , , , , ],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const expected = [
			{
				formats: [ , , , , [ em ], [ em ] ],
				lineFormats: [ , , , , , , ],
				objects: [ , , , , , , ],
				text: 'one tw',
			},
			{
				formats: [ [ em ], , , , , , , ],
				lineFormats: [ , , , , , , , ],
				objects: [ , , , , , , , ],
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
			lineFormats: [],
			objects: [],
			text: '',
			start: 0,
			end: 0,
		};
		const expected = [
			{
				formats: [],
				lineFormats: [],
				objects: [],
				text: '',
			},
			{
				formats: [],
				lineFormats: [],
				objects: [],
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
			lineFormats: [ , , , , , , , , , , ],
			objects: [ , , , , , , , , , , ],
			text: 'test\u2028\u2028test',
			start: 5,
			end: 5,
		};
		const expected = [
			{
				formats: [ , , , , ],
				lineFormats: [ , , , , ],
				objects: [ , , , , ],
				text: 'test',
			},
			{
				formats: [ , , , , ],
				lineFormats: [ , , , , ],
				objects: [ , , , , ],
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
			lineFormats: [ , , , , , , , , , , , , , , , , , , , , , , , ],
			objects: [ , , , , , , , , , , , , , , , , , , , , , , , ],
			text: 'one two three four five',
		};
		const expected = [
			{
				formats: [ , , , ],
				lineFormats: [ , , , ],
				objects: [ , , , ],
				text: 'one',
			},
			{
				start: 2,
				end: 3,
				formats: [ [ em ], [ em ], [ em ] ],
				lineFormats: [ , , , ],
				objects: [ , , , ],
				text: 'two',
			},
			{
				start: 0,
				end: 5,
				formats: [ , , , , , ],
				lineFormats: [ , , , , , ],
				objects: [ , , , , , ],
				text: 'three',
			},
			{
				start: 0,
				end: 2,
				formats: [ , , , , ],
				lineFormats: [ , , , , ],
				objects: [ , , , , ],
				text: 'four',
			},
			{
				formats: [ , , , , ],
				lineFormats: [ , , , , ],
				objects: [ , , , , ],
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
			lineFormats: [ , , , , , , , , , , , , , ],
			objects: [ , , , , , , , , , , , , , ],
			text: 'one two three',
		};
		const expected = [
			{
				formats: [ , , , ],
				lineFormats: [ , , , ],
				objects: [ , , , ],
				text: 'one',
			},
			{
				start: 1,
				end: 2,
				formats: [ [ em ], [ em ], [ em ] ],
				lineFormats: [ , , , ],
				objects: [ , , , ],
				text: 'two',
			},
			{
				formats: [ , , , , , ],
				lineFormats: [ , , , , , ],
				objects: [ , , , , , ],
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
