/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Internal dependencies
 */
import { humanTimeDiff } from '../';

describe( 'date', () => {
	describe( 'humanTimeDiff', () => {
		it( 'should be a difference of "3 days"', () => {
			const to = moment().subtract( 3, 'days' );
			expect( humanTimeDiff( 'now', to ) ).toBe( '3 days' );
		} );
		it( 'should be a suffixed difference of "seconds ago"', () => {
			const to = moment().subtract( 3, 'seconds' );
			expect( humanTimeDiff( 'now', to, true ) ).toBe( 'seconds ago' );
		} );
		it( 'should be a suffixed difference of "3 days ago"', () => {
			const to = moment().subtract( 3, 'days' );
			expect( humanTimeDiff( 'now', to, true ) ).toBe( '3 days ago' );
		} );
		it( 'should also be a suffixed difference of "3 days ago"', () => {
			const from = moment().subtract( 3, 'days' );
			const to = moment().subtract( 6, 'days' );
			expect( humanTimeDiff( from, to, true ) ).toBe( '3 days ago' );
		} );
		it( 'should be a suffixed difference of "a month from now"', () => {
			const to = moment().add( 5, 'weeks' );
			expect( humanTimeDiff( 'now', to, true ) ).toBe( 'a month from now' );
		} );
		it( 'should be a suffixed difference of "a day from now"', () => {
			const to = moment().add( 1, 'days' );
			expect( humanTimeDiff( 'now', to, true ) ).toBe( 'a day from now' );
		} );
		it( 'should be a suffixed difference of "3 days from now"', () => {
			const to = moment().add( 3, 'days' );
			expect( humanTimeDiff( 'now', to, true ) ).toBe( '3 days from now' );
		} );
	} );
} );
