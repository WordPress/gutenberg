import { describe, expect, it } from 'vitest';
import { parseISODate } from '../date-model';

describe( 'date text validation', () => {
	it.each( [
		'0001-01-01',
		'0099-12-31',
		'2000-02-29',
		'2024-02-29',
		'2026-02-28',
		'2026-04-30',
		'9999-12-31',
	] )( 'accepts and preserves %s', ( text ) => {
		expect( parseISODate( text ) ).toBe( text );
	} );
	it.each( [
		'',
		'2026-',
		'2026-02-',
		'2026-2-20',
		'26-02-20',
		'2026-02-20T00:00:00Z',
		'0000-01-01',
		'10000-01-01',
		'1900-02-29',
		'2100-02-29',
		'2026-02-30',
		'2026-04-31',
		'2026-00-20',
		'2026-13-20',
		'2026-01-00',
		'2026-01-32',
		' 2026-02-20',
		'2026-02-20junk',
	] )(
		'rejects incomplete or impossible text %s without correction',
		( text ) => {
			expect( parseISODate( text ) ).toBeNull();
		}
	);
} );
