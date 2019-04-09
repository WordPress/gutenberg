/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { applyFormat } from '../apply-format';
import { getSparseArrayLength } from './helpers';

describe( 'applyFormat', () => {
	const strong = { type: 'strong' };
	const em = { type: 'em' };
	const a = { type: 'a', attributes: { href: '#' } };
	const a2 = { type: 'a', attributes: { href: '#test' } };

	it( 'should apply format', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
		};
		const expected = {
			formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
			text: 'one two three',
		};
		const result = applyFormat( deepFreeze( record ), strong, 3, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 4 );
	} );

	it( 'should apply format by selection', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const expected = {
			formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const result = applyFormat( deepFreeze( record ), strong );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 4 );
	} );

	it( 'should apply format in placeholder if selection is collapsed', () => {
		const record = {
			formats: [ , , , , [ a ], [ a ], [ a ], , , , , , , ],
			text: 'one two three',
			start: 0,
			end: 0,
		};
		const expected = {
			...record,
			activeFormats: [ a2 ],
		};
		const result = applyFormat( deepFreeze( record ), a2 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 3 );
	} );

	it( 'should apply format on existing format if selection is collapsed', () => {
		const record = {
			formats: [ , , , , [ a ], [ a ], [ a ], , , , , , , ],
			text: 'one two three',
			start: 4,
			end: 4,
		};
		const expected = {
			formats: [ , , , , [ a2 ], [ a2 ], [ a2 ], , , , , , , ],
			text: 'one two three',
			start: 4,
			end: 4,
		};
		const result = applyFormat( deepFreeze( record ), a2 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 3 );
	} );
} );
