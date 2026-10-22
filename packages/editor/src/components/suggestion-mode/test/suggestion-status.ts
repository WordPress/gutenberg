import { describe, expect, it } from 'vitest';
import {
	getDecision,
	getProvisionalStatus,
	getSuggestionStatus,
	isFinalStatus,
	isPendingStatus,
	isProvisionalStatus,
} from '../suggestion-status';

const withStatus = ( status: unknown ) => ( {
	meta: { _wp_suggestion_status: status },
} );

describe( 'getSuggestionStatus', () => {
	it( 'reads a known status', () => {
		expect( getSuggestionStatus( withStatus( 'applied-unsaved' ) ) ).toBe(
			'applied-unsaved'
		);
		expect( getSuggestionStatus( withStatus( 'outdated' ) ) ).toBe(
			'outdated'
		);
	} );

	it( 'reads absent, empty and unknown values as pending', () => {
		expect( getSuggestionStatus( {} ) ).toBe( 'pending' );
		expect( getSuggestionStatus( null ) ).toBe( 'pending' );
		expect( getSuggestionStatus( withStatus( '' ) ) ).toBe( 'pending' );
		expect( getSuggestionStatus( withStatus( 'someday' ) ) ).toBe(
			'pending'
		);
	} );
} );

describe( 'status predicates', () => {
	it.each( [
		[ 'pending', true, false, false, null ],
		[ 'applied-unsaved', false, true, false, 'applied' ],
		[ 'rejected-unsaved', false, true, false, 'rejected' ],
		[ 'applied', false, false, true, 'applied' ],
		[ 'rejected', false, false, true, 'rejected' ],
		[ 'outdated', false, false, true, null ],
	] as const )(
		'%s: pending %s, provisional %s, final %s, decision %s',
		( status, pending, provisional, final, decision ) => {
			expect( isPendingStatus( status ) ).toBe( pending );
			expect( isProvisionalStatus( status ) ).toBe( provisional );
			expect( isFinalStatus( status ) ).toBe( final );
			expect( getDecision( status ) ).toBe( decision );
		}
	);

	it( 'maps a decision to the status a client writes', () => {
		expect( getProvisionalStatus( 'applied' ) ).toBe( 'applied-unsaved' );
		expect( getProvisionalStatus( 'rejected' ) ).toBe( 'rejected-unsaved' );
	} );
} );
