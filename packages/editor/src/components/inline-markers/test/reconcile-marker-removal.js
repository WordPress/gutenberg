/**
 * Internal dependencies
 */
import { reconcileMarkerRemoval } from '../reconcile-marker-removal';

describe( 'reconcileMarkerRemoval', () => {
	it( 'returns "anchor" when the marker is present', () => {
		const anchored = new Set();
		expect( reconcileMarkerRemoval( true, 7, anchored ) ).toBe( 'anchor' );
	} );

	it( 'returns "delete" when a previously anchored marker is now gone', () => {
		const anchored = new Set( [ 7 ] );
		expect( reconcileMarkerRemoval( false, 7, anchored ) ).toBe( 'delete' );
	} );

	it( 'returns "skip" when the marker is gone but was never observed', () => {
		const anchored = new Set();
		expect( reconcileMarkerRemoval( false, 7, anchored ) ).toBe( 'skip' );
	} );

	it( 'returns "skip" when presence is undeterminable (null/undefined)', () => {
		const anchored = new Set( [ 7 ] );
		expect( reconcileMarkerRemoval( null, 7, anchored ) ).toBe( 'skip' );
		expect( reconcileMarkerRemoval( undefined, 7, anchored ) ).toBe(
			'skip'
		);
	} );

	it( 'keys the session guard by id', () => {
		const anchored = new Set( [ 1 ] );
		// id 1 was seen -> delete; id 2 was not -> skip.
		expect( reconcileMarkerRemoval( false, 1, anchored ) ).toBe( 'delete' );
		expect( reconcileMarkerRemoval( false, 2, anchored ) ).toBe( 'skip' );
	} );
} );
