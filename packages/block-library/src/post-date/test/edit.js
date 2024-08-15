/**
 * Internal dependencies
 */
import { is12HourFormat } from '../edit';

describe( 'is12HourFormat', () => {
	test.each( [
		[ '', false ],
		[ 'H:i', false ],
		[ 'g:i A', true ],
		[ 'g:i a', true ],
		[ 'h:i', true ],
		[ '\\g\\r\\e\\a\\t', false ],
	] )( 'is12HourFormat( %p ) = %p', ( format, expected ) => {
		expect( is12HourFormat( format ) ).toBe( expected );
	} );
} );
