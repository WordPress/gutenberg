import { describe, expect, it } from 'vitest';
import { getDateError, serializeDate } from '../validation';

describe( 'text date validation', () => {
	it.each( [
		[ '2026-02-19', 'Enter a date on or after 2026-02-20.' ],
		[ '2026-02-20', '' ],
		[ '2026-02-28', '' ],
		[ '2026-03-01', 'Enter a date on or before 2026-02-28.' ],
	] )( 'enforces inclusive date bounds for %s', ( text, error ) => {
		expect(
			getDateError( text, { min: '2026-02-20', max: '2026-02-28' } )
		).toBe( error );
	} );
	it( 'rejects unavailable dates without calling the predicate for an invalid draft', () => {
		const calls: string[] = [];
		const constraints = {
			isDateUnavailable: ( date: string ) => {
				calls.push( date );
				return true;
			},
		};
		expect( getDateError( '2026-02-30', constraints ) ).toBeTruthy();
		expect( calls ).toEqual( [] );
		expect( getDateError( '2026-02-20', constraints ) ).toBe(
			'This date is unavailable.'
		);
		expect( calls ).toEqual( [ '2026-02-20' ] );
	} );
	it( 'distinguishes empty values from invalid public values', () => {
		expect( serializeDate( null ) ).toBe( '' );
		expect( () => serializeDate( '' ) ).toThrow( RangeError );
		expect( () => serializeDate( '2026-02-30' ) ).toThrow( RangeError );
	} );
} );
