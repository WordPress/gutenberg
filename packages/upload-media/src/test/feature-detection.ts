/**
 * Internal dependencies
 */
import {
	detectClientSideMediaSupport,
	isClientSideMediaSupported,
	clearFeatureDetectionCache,
} from '../feature-detection';

describe( 'feature-detection', () => {
	const originalWebAssembly = global.WebAssembly;
	const originalSharedArrayBuffer = global.SharedArrayBuffer;
	const originalCrossOriginIsolated = window.crossOriginIsolated;

	beforeEach( () => {
		// Clear the cache before each test.
		clearFeatureDetectionCache();
	} );

	afterEach( () => {
		// Restore original values.
		global.WebAssembly = originalWebAssembly;
		global.SharedArrayBuffer = originalSharedArrayBuffer;
		Object.defineProperty( window, 'crossOriginIsolated', {
			value: originalCrossOriginIsolated,
			writable: true,
			configurable: true,
		} );
	} );

	describe( 'detectClientSideMediaSupport', () => {
		it( 'returns supported when all features are available', () => {
			// Ensure all features are available.
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;
			Object.defineProperty( window, 'crossOriginIsolated', {
				value: true,
				writable: true,
				configurable: true,
			} );

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( true );
			expect( result.reason ).toBeUndefined();
		} );

		it( 'returns not supported when WebAssembly is unavailable', () => {
			// @ts-ignore - Intentionally removing WebAssembly for testing.
			delete global.WebAssembly;

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toBe(
				'WebAssembly is not supported in this browser'
			);
		} );

		it( 'returns not supported when SharedArrayBuffer is unavailable', () => {
			global.WebAssembly = originalWebAssembly;
			// @ts-ignore - Intentionally removing SharedArrayBuffer for testing.
			delete global.SharedArrayBuffer;

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toContain( 'SharedArrayBuffer' );
		} );

		it( 'returns not supported when cross-origin isolation is disabled', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;
			Object.defineProperty( window, 'crossOriginIsolated', {
				value: false,
				writable: true,
				configurable: true,
			} );

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toContain( 'Cross-origin isolation' );
		} );

		it( 'caches the result', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;
			Object.defineProperty( window, 'crossOriginIsolated', {
				value: true,
				writable: true,
				configurable: true,
			} );

			const result1 = detectClientSideMediaSupport();
			expect( result1.supported ).toBe( true );

			// Now remove WebAssembly - cached result should still be returned.
			// @ts-ignore - Intentionally removing WebAssembly for testing.
			delete global.WebAssembly;

			const result2 = detectClientSideMediaSupport();
			expect( result2.supported ).toBe( true );
			expect( result2 ).toBe( result1 ); // Same object reference.
		} );
	} );

	describe( 'isClientSideMediaSupported', () => {
		it( 'returns true when all features are available', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;
			Object.defineProperty( window, 'crossOriginIsolated', {
				value: true,
				writable: true,
				configurable: true,
			} );

			expect( isClientSideMediaSupported() ).toBe( true );
		} );

		it( 'returns false when features are unavailable', () => {
			// @ts-ignore - Intentionally removing WebAssembly for testing.
			delete global.WebAssembly;

			expect( isClientSideMediaSupported() ).toBe( false );
		} );
	} );

	describe( 'clearFeatureDetectionCache', () => {
		it( 'clears the cached result', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;
			Object.defineProperty( window, 'crossOriginIsolated', {
				value: true,
				writable: true,
				configurable: true,
			} );

			const result1 = detectClientSideMediaSupport();
			expect( result1.supported ).toBe( true );

			// Clear cache and remove WebAssembly.
			clearFeatureDetectionCache();
			// @ts-ignore - Intentionally removing WebAssembly for testing.
			delete global.WebAssembly;

			const result2 = detectClientSideMediaSupport();
			expect( result2.supported ).toBe( false );
		} );
	} );
} );
