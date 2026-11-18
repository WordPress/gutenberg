import { describe, expect, it } from 'vitest';
import getPaginationMeta from '../get-pagination-meta';

const createHeaders = ( values: Record< string, string > ) =>
	// The stub provides only what `getPaginationMeta` needs.
	( {
		get: ( header: string ) => values[ header ] ?? null,
	} ) as unknown as Headers;

describe( 'getPaginationMeta', () => {
	it( 'returns the totals reported by the headers', () => {
		const result = getPaginationMeta(
			createHeaders( {
				'X-WP-Total': '10',
				'X-WP-TotalPages': '5',
			} )
		);

		expect( result ).toEqual( { totalItems: 10, totalPages: 5 } );
	} );

	it( 'returns null for totals the headers do not report', () => {
		const result = getPaginationMeta( createHeaders( {} ) );

		expect( result ).toEqual( { totalItems: null, totalPages: null } );
	} );
} );
