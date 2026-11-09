import { describe, expect, test } from 'vitest';
import { is12HourFormat, isValidDatetime } from '../edit';

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

describe( 'isValidDatetime', () => {
	test.each( [
		[ undefined, false ],
		[ '', false ],
		[ 'Post Modified Date', false ],
		[ '2026-11-05T11:38:45', true ],
		[ '2026-11-05T11:38:45-08:00', true ],
		[ new Date( '2026-11-05T11:38:45Z' ), true ],
		[ new Date( 'invalid' ), false ],
	] )( 'isValidDatetime( %p ) = %p', ( datetime, expected ) => {
		expect( isValidDatetime( datetime ) ).toBe( expected );
	} );
} );
