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
			text: 'one two three',
		};
		const expected = [
			{
				formats: [ , , , , [ em ], [ em ] ],
				text: 'one tw',
			},
			{
				start: 0,
				end: 0,
				formats: [ [ em ], , , , , , , ],
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
			text: 'one two three',
			start: 6,
			end: 6,
		};
		const expected = [
			{
				formats: [ , , , , [ em ], [ em ] ],
				text: 'one tw',
			},
			{
				formats: [ [ em ], , , , , , , ],
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
			text: '',
			start: 0,
			end: 0,
		};
		const expected = [
			{
				formats: [],
				text: '',
			},
			{
				formats: [],
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

	it( 'should split search', () => {
		const record = {
			start: 6,
			end: 16,
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , , , , , , , , , , , ],
			text: 'one two three four five',
		};
		const expected = [
			{
				formats: [ , , , ],
				text: 'one',
			},
			{
				start: 2,
				end: 3,
				formats: [ [ em ], [ em ], [ em ] ],
				text: 'two',
			},
			{
				start: 0,
				end: 5,
				formats: [ , , , , , ],
				text: 'three',
			},
			{
				start: 0,
				end: 2,
				formats: [ , , , , ],
				text: 'four',
			},
			{
				formats: [ , , , , ],
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
			text: 'one two three',
		};
		const expected = [
			{
				formats: [ , , , ],
				text: 'one',
			},
			{
				start: 1,
				end: 2,
				formats: [ [ em ], [ em ], [ em ] ],
				text: 'two',
			},
			{
				formats: [ , , , , , ],
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
