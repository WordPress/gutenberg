/**
 * Internal dependencies
 */
import { isUnsupportedConversionError } from '../mediabunny';

describe( 'isUnsupportedConversionError', () => {
	// These are the exact messages thrown by @wordpress/mediabunny's
	// convertGifToVideo (see packages/mediabunny/src/index.ts). They are
	// duplicated here intentionally: the worker RPC layer (comctx) serializes
	// a thrown error to its message string only, so the cross-boundary
	// contract is the message prefix. If the worker wording drifts without
	// updating this guard, this test fails.
	it.each( [
		'Unsupported: WebCodecs unavailable',
		'Unsupported: encoder codec not supported',
	] )( 'recognizes graceful outcome: %s', ( message ) => {
		expect( isUnsupportedConversionError( new Error( message ) ) ).toBe(
			true
		);
	} );

	it( 'treats a real failure as non-graceful', () => {
		expect(
			isUnsupportedConversionError(
				new Error( 'Encoder produced empty output' )
			)
		).toBe( false );
	} );

	it( 'treats a non-Error value as non-graceful', () => {
		expect( isUnsupportedConversionError( 'Unsupported' ) ).toBe( false );
		expect( isUnsupportedConversionError( undefined ) ).toBe( false );
	} );
} );
