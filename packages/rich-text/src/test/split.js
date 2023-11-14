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
			_formats: new Map( [ [ em, [ 4, 7 ] ] ] ),
			replacements: [ , , , , , , , , , , , , , ],
			text: 'one two three',
		};
		const expected = [
			{
				formats: [ , , , , [ em ], [ em ] ],
				_formats: new Map( [ [ em, [ 4, 6 ] ] ] ),
				replacements: [ , , , , , , ],
				text: 'one tw',
			},
			{
				start: 0,
				end: 0,
				formats: [ [ em ], , , , , , , ],
				_formats: new Map( [ [ em, [ 0, 1 ] ] ] ),
				replacements: [ , , , , , , , ],
				text: 'o three',
			},
		];
		const result = split( deepFreeze( record ), 6, 6 );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) ).toBe(
				getSparseArrayLength( expected[ index ].formats )
			);
		} );
	} );

	it( 'should split with selection', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_formats: new Map( [ [ em, [ 4, 7 ] ] ] ),
			replacements: [ , , , , , , , , , , , , , ],
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const expected = [
			{
				formats: [ , , , , [ em ], [ em ] ],
				_formats: new Map( [ [ em, [ 4, 6 ] ] ] ),
				replacements: [ , , , , , , ],
				text: 'one tw',
			},
			{
				formats: [ [ em ], , , , , , , ],
				_formats: new Map( [ [ em, [ 0, 1 ] ] ] ),
				replacements: [ , , , , , , , ],
				text: 'o three',
				start: 0,
				end: 0,
			},
		];
		const result = split( deepFreeze( record ) );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) ).toBe(
				getSparseArrayLength( expected[ index ].formats )
			);
		} );
	} );

	it( 'should split empty', () => {
		const record = {
			formats: [],
			_formats: new Map(),
			replacements: [],
			text: '',
			start: 0,
			end: 0,
		};
		const expected = [
			{
				formats: [],
				_formats: new Map(),
				replacements: [],
				text: '',
			},
			{
				formats: [],
				_formats: new Map(),
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
			expect( getSparseArrayLength( item.formats ) ).toBe(
				getSparseArrayLength( expected[ index ].formats )
			);
		} );
	} );

	it( 'should split search', () => {
		const record = {
			start: 6,
			end: 16,
			formats: [
				,
				,
				,
				,
				[ em ],
				[ em ],
				[ em ],
				,
				,
				,
				,
				,
				,
				,
				,
				,
				,
				,
				,
				,
				,
				,
				,
			],
			_formats: new Map( [ [ em, [ 4, 7 ] ] ] ),
			replacements: [ , , , , , , , , , , , , , , , , , , , , , , , ],
			text: 'one two three four five',
		};
		const expected = [
			{
				formats: [ , , , ],
				_formats: new Map(),
				replacements: [ , , , ],
				text: 'one',
			},
			{
				start: 2,
				end: 3,
				formats: [ [ em ], [ em ], [ em ] ],
				_formats: new Map( [ [ em, [ 0, 3 ] ] ] ),
				replacements: [ , , , ],
				text: 'two',
			},
			{
				start: 0,
				end: 5,
				formats: [ , , , , , ],
				_formats: new Map(),
				replacements: [ , , , , , ],
				text: 'three',
			},
			{
				start: 0,
				end: 2,
				formats: [ , , , , ],
				_formats: new Map(),
				replacements: [ , , , , ],
				text: 'four',
			},
			{
				formats: [ , , , , ],
				_formats: new Map(),
				replacements: [ , , , , ],
				text: 'five',
			},
		];
		const result = split( deepFreeze( record ), ' ' );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) ).toBe(
				getSparseArrayLength( expected[ index ].formats )
			);
		} );
	} );

	it( 'should split search 2', () => {
		const record = {
			start: 5,
			end: 6,
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			_formats: new Map( [ [ em, [ 4, 7 ] ] ] ),
			replacements: [ , , , , , , , , , , , , , ],
			text: 'one two three',
		};
		const expected = [
			{
				formats: [ , , , ],
				_formats: new Map(),
				replacements: [ , , , ],
				text: 'one',
			},
			{
				start: 1,
				end: 2,
				formats: [ [ em ], [ em ], [ em ] ],
				_formats: new Map( [ [ em, [ 0, 3 ] ] ] ),
				replacements: [ , , , ],
				text: 'two',
			},
			{
				formats: [ , , , , , ],
				_formats: new Map(),
				replacements: [ , , , , , ],
				text: 'three',
			},
		];
		const result = split( deepFreeze( record ), ' ' );

		expect( result ).toEqual( expected );
		result.forEach( ( item, index ) => {
			expect( item ).not.toBe( record );
			expect( getSparseArrayLength( item.formats ) ).toBe(
				getSparseArrayLength( expected[ index ].formats )
			);
		} );
	} );

	it( 'should not split without selection', () => {
		const record = {
			formats: [],
			_formats: new Map(),
			replacements: [],
			text: '',
		};
		expect( split( deepFreeze( record ) ) ).toBe( undefined );
	} );
} );
