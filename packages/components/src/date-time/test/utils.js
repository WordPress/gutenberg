/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Internal dependencies
 */
import { getMomentDate } from '../utils';

describe( 'getMomentDate', () => {
	it( 'should return a Moment object representing a given date string', () => {
		const currentDate = '1986-10-18T23:00:00';
		const momentDate = getMomentDate( currentDate );

		expect( moment.isMoment( momentDate ) ).toBe( true );
		expect( momentDate.isSame( moment( currentDate ) ) ).toBe( true );
	} );

	it( 'should return null when given a null argument', () => {
		const currentDate = null;
		const momentDate = getMomentDate( currentDate );

		expect( momentDate ).toBeNull();
	} );

	it( 'should return a Moment object representing now when given an undefined argument', () => {
		const momentDate = getMomentDate();

		expect( moment.isMoment( momentDate ) ).toBe( true );
	} );
} );
