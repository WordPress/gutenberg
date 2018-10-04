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
			_start: 5,
			_end: 10,
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
		};
		const expected = [
			{
				_formats: [ , , , , [ em ], [ em ] ],
				_text: 'one tw',
			},
			{
				_start: 0,
				_end: 0,
				_formats: [ [ em ], , , , , , , ],
				_text: 'o three',
			},
		];
		const result = split( deepFreeze( record ), 6, 6 );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item._formats ) )
				.toBe( getSparseArrayLength( expected[ index ]._formats ) );
		} );
	} );

	it( 'should split with selection', () => {
		const record = {
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
			_start: 6,
			_end: 6,
		};
		const expected = [
			{
				_formats: [ , , , , [ em ], [ em ] ],
				_text: 'one tw',
			},
			{
				_formats: [ [ em ], , , , , , , ],
				_text: 'o three',
				_start: 0,
				_end: 0,
			},
		];
		const result = split( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item._formats ) )
				.toBe( getSparseArrayLength( expected[ index ]._formats ) );
		} );
	} );

	it( 'should split empty', () => {
		const record = {
			_formats: [],
			_text: '',
			_start: 0,
			_end: 0,
		};
		const expected = [
			{
				_formats: [],
				_text: '',
			},
			{
				_formats: [],
				_text: '',
				_start: 0,
				_end: 0,
			},
		];
		const result = split( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item._formats ) )
				.toBe( getSparseArrayLength( expected[ index ]._formats ) );
		} );
	} );

	it( 'should split multiline', () => {
		const record = {
			_formats: [ , , , , , , , , , , ],
			_text: 'test\u2028\u2028test',
			_start: 5,
			_end: 5,
		};
		const expected = [
			{
				_formats: [ , , , , ],
				_text: 'test',
			},
			{
				_formats: [ , , , , ],
				_text: 'test',
				_start: 0,
				_end: 0,
			},
		];
		const result = split( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item._formats ) )
				.toBe( getSparseArrayLength( expected[ index ]._formats ) );
		} );
	} );

	it( 'should split search', () => {
		const record = {
			_start: 6,
			_end: 16,
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , , , , , , , , , , , ],
			_text: 'one two three four five',
		};
		const expected = [
			{
				_formats: [ , , , ],
				_text: 'one',
			},
			{
				_start: 2,
				_end: 3,
				_formats: [ [ em ], [ em ], [ em ] ],
				_text: 'two',
			},
			{
				_start: 0,
				_end: 5,
				_formats: [ , , , , , ],
				_text: 'three',
			},
			{
				_start: 0,
				_end: 2,
				_formats: [ , , , , ],
				_text: 'four',
			},
			{
				_formats: [ , , , , ],
				_text: 'five',
			},
		];
		const result = split( deepFreeze( record ), ' ' );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item._formats ) )
				.toBe( getSparseArrayLength( expected[ index ]._formats ) );
		} );
	} );

	it( 'should split search 2', () => {
		const record = {
			_start: 5,
			_end: 6,
			_formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_text: 'one two three',
		};
		const expected = [
			{
				_formats: [ , , , ],
				_text: 'one',
			},
			{
				_start: 1,
				_end: 2,
				_formats: [ [ em ], [ em ], [ em ] ],
				_text: 'two',
			},
			{
				_formats: [ , , , , , ],
				_text: 'three',
			},
		];
		const result = split( deepFreeze( record ), ' ' );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item._formats ) )
				.toBe( getSparseArrayLength( expected[ index ]._formats ) );
		} );
	} );
} );
