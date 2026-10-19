import { afterEach, describe, expect, it, vi } from 'vitest';
import getValidationMessage from '../get-validation-message';
import type { FieldValidity } from '../../../types';

const toLocaleString = Number.prototype.toLocaleString;

afterEach( () => vi.restoreAllMocks() );

describe( 'getValidationMessage', () => {
	it.each( [
		[ 'en-US', '1,234' ],
		[ 'de-DE', '1.234' ],
	] )( 'formats large validation counts using %s', ( locale, count ) => {
		vi.spyOn( Number.prototype, 'toLocaleString' ).mockImplementation(
			function ( this: number ) {
				return toLocaleString.call( this, locale );
			}
		);
		const validity: FieldValidity = {
			children: Object.fromEntries(
				Array.from( { length: 1234 }, ( _, i ) => [
					`field-${ i }`,
					{ required: { type: 'invalid', message: 'Required' } },
				] )
			),
		};
		expect( getValidationMessage( validity ) ).toBe(
			`${ count } fields need attention`
		);
	} );

	it( 'uses the singular form for one invalid field', () => {
		expect(
			getValidationMessage( {
				required: { type: 'invalid', message: 'Required' },
			} )
		).toBe( '1 field needs attention' );
	} );

	it( 'omits the message when all fields are valid', () => {
		expect(
			getValidationMessage( { required: { type: 'valid' } } )
		).toBeUndefined();
	} );
} );
