import { isMediaDropEligible } from '../utils';

describe( 'isMediaDropEligible', () => {
	it( 'returns false for a canvas block-reorder drag', () => {
		const result = isMediaDropEligible(
			[ 'wp-blocks' ],
			[ 'audio' ],
			true
		);

		expect( result ).toBe( false );
	} );

	it( 'returns true for an allowed inserter media block drag', () => {
		const result = isMediaDropEligible(
			[ 'wp-block:core/audio' ],
			[ 'audio' ],
			true
		);

		expect( result ).toBe( true );
	} );

	it( 'returns false for a disallowed inserter block drag', () => {
		const result = isMediaDropEligible(
			[ 'wp-block:core/paragraph' ],
			[ 'audio' ],
			true
		);

		expect( result ).toBe( false );
	} );

	it( 'returns false for multiple inserter media block drags when multiple is false', () => {
		const result = isMediaDropEligible(
			[ 'wp-block:core/audio', 'wp-block:core/image' ],
			[ 'audio', 'image' ],
			false
		);

		expect( result ).toBe( false );
	} );

	it( 'returns true for a single inserter media block drag when multiple is false', () => {
		const result = isMediaDropEligible(
			[ 'wp-block:core/audio' ],
			[ 'audio' ],
			false
		);

		expect( result ).toBe( true );
	} );
} );
