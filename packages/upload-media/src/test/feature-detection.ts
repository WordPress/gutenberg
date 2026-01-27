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
	const originalWorker = global.Worker;
	const originalCreateObjectURL = global.URL.createObjectURL;
	const originalRevokeObjectURL = global.URL.revokeObjectURL;

	beforeEach( () => {
		// Clear the cache before each test.
		clearFeatureDetectionCache();

		// By default, provide a mock Worker that does not throw (CSP allows blob workers).
		global.Worker = class MockWorker {
			terminate() {}
		} as unknown as typeof Worker;

		// jsdom does not implement URL.createObjectURL/revokeObjectURL.
		global.URL.createObjectURL = jest.fn(
			() => 'blob:http://localhost/test'
		);
		global.URL.revokeObjectURL = jest.fn();
	} );

	afterEach( () => {
		// Restore original values.
		global.WebAssembly = originalWebAssembly;
		global.SharedArrayBuffer = originalSharedArrayBuffer;
		global.Worker = originalWorker;
		global.URL.createObjectURL = originalCreateObjectURL;
		global.URL.revokeObjectURL = originalRevokeObjectURL;
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
			// @ts-ignore - Intentionally setting WebAssembly to undefined for testing.
			Object.defineProperty( global, 'WebAssembly', {
				value: undefined,
				writable: true,
				configurable: true,
			} );

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toBe(
				'WebAssembly is not supported in this browser'
			);
		} );

		it( 'returns not supported when SharedArrayBuffer is unavailable', () => {
			global.WebAssembly = originalWebAssembly;
			// @ts-ignore - Intentionally setting SharedArrayBuffer to undefined for testing.
			Object.defineProperty( global, 'SharedArrayBuffer', {
				value: undefined,
				writable: true,
				configurable: true,
			} );

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

		it( 'returns not supported when CSP blocks blob workers', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;
			Object.defineProperty( window, 'crossOriginIsolated', {
				value: true,
				writable: true,
				configurable: true,
			} );

			// Simulate CSP blocking blob URL workers by throwing a SecurityError.
			global.Worker = class ThrowingWorker {
				constructor() {
					throw new DOMException(
						"Refused to create a worker from 'blob:...' because it violates the Content Security Policy directive: \"worker-src 'self'\".",
						'SecurityError'
					);
				}
			} as unknown as typeof Worker;

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toContain( 'Content Security Policy' );
			expect( result.reason ).toContain( 'worker-src' );
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

			// Now set WebAssembly to undefined - cached result should still be returned.
			// @ts-ignore - Intentionally setting WebAssembly to undefined for testing.
			Object.defineProperty( global, 'WebAssembly', {
				value: undefined,
				writable: true,
				configurable: true,
			} );

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
			// @ts-ignore - Intentionally setting WebAssembly to undefined for testing.
			Object.defineProperty( global, 'WebAssembly', {
				value: undefined,
				writable: true,
				configurable: true,
			} );

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

			// Clear cache and set WebAssembly to undefined.
			clearFeatureDetectionCache();
			// @ts-ignore - Intentionally setting WebAssembly to undefined for testing.
			Object.defineProperty( global, 'WebAssembly', {
				value: undefined,
				writable: true,
				configurable: true,
			} );

			const result2 = detectClientSideMediaSupport();
			expect( result2.supported ).toBe( false );
		} );
	} );
} );
