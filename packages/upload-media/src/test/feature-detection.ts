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
	const originalWorker = global.Worker;
	const originalCreateObjectURL = global.URL.createObjectURL;
	const originalRevokeObjectURL = global.URL.revokeObjectURL;

	// Store original property descriptors for navigator properties.
	const originalDeviceMemoryDescriptor = Object.getOwnPropertyDescriptor(
		navigator,
		'deviceMemory'
	);
	const originalConnectionDescriptor = Object.getOwnPropertyDescriptor(
		navigator,
		'connection'
	);

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

		// Mock credentialless iframe support so the check passes by default.
		if ( ! ( 'credentialless' in window.HTMLIFrameElement.prototype ) ) {
			Object.defineProperty(
				window.HTMLIFrameElement.prototype,
				'credentialless',
				{
					value: false,
					writable: true,
					configurable: true,
				}
			);
		}

		// Remove navigator.deviceMemory and navigator.connection by default
		// so they don't interfere with unrelated tests.
		if ( 'deviceMemory' in navigator ) {
			// @ts-ignore
			delete navigator.deviceMemory;
		}
		if ( 'connection' in navigator ) {
			// @ts-ignore
			delete navigator.connection;
		}
	} );

	afterEach( () => {
		// Restore original values.
		global.WebAssembly = originalWebAssembly;
		global.SharedArrayBuffer = originalSharedArrayBuffer;
		global.Worker = originalWorker;
		global.URL.createObjectURL = originalCreateObjectURL;
		global.URL.revokeObjectURL = originalRevokeObjectURL;

		// Restore credentialless property.
		if ( 'credentialless' in window.HTMLIFrameElement.prototype ) {
			delete ( window.HTMLIFrameElement.prototype as any ).credentialless;
		}

		// Restore navigator.deviceMemory.
		if ( originalDeviceMemoryDescriptor ) {
			Object.defineProperty(
				navigator,
				'deviceMemory',
				originalDeviceMemoryDescriptor
			);
		} else if ( 'deviceMemory' in navigator ) {
			// @ts-ignore
			delete navigator.deviceMemory;
		}

		// Restore navigator.connection.
		if ( originalConnectionDescriptor ) {
			Object.defineProperty(
				navigator,
				'connection',
				originalConnectionDescriptor
			);
		} else if ( 'connection' in navigator ) {
			// @ts-ignore
			delete navigator.connection;
		}
	} );

	describe( 'detectClientSideMediaSupport', () => {
		it( 'returns supported when all features are available', () => {
			// Ensure all features are available.
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( true );
			expect( result.reason ).toBeUndefined();
		} );

		it( 'returns not supported when WebAssembly is unavailable', () => {
			// @ts-ignore - Intentionally setting WebAssembly to undefined for testing.
			global.WebAssembly = undefined;

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toBe(
				'WebAssembly is not supported in this browser'
			);
		} );

		it( 'returns not supported when SharedArrayBuffer is unavailable', () => {
			global.WebAssembly = originalWebAssembly;
			// @ts-ignore - Intentionally setting SharedArrayBuffer to undefined for testing.
			global.SharedArrayBuffer = undefined;

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toContain( 'SharedArrayBuffer' );
		} );

		it( 'returns not supported when Worker is unavailable', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;
			// @ts-ignore - Intentionally setting Worker to undefined for testing.
			global.Worker = undefined;

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toBe(
				'Web Workers are not supported in this browser.'
			);
		} );

		it( 'returns not supported when credentialless iframes are not supported', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			// Remove credentialless from the prototype.
			delete ( window.HTMLIFrameElement.prototype as any ).credentialless;

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toContain( 'credentialless iframes' );
		} );

		it( 'returns supported when credentialless iframes are supported', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			// credentialless is already mocked in beforeEach.
			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( true );
		} );

		it( 'returns not supported when device memory is 2 GB or less', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			Object.defineProperty( navigator, 'deviceMemory', {
				value: 2,
				configurable: true,
			} );

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toContain( 'insufficient memory' );
		} );

		it( 'returns supported when device memory is greater than 2 GB', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			Object.defineProperty( navigator, 'deviceMemory', {
				value: 4,
				configurable: true,
			} );

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( true );
		} );

		it( 'returns not supported when data saver is enabled', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			Object.defineProperty( navigator, 'connection', {
				value: { saveData: true, effectiveType: '4g' },
				configurable: true,
			} );

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toBe( 'Data saver mode is enabled.' );
		} );

		it( 'returns not supported when connection is 2g', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			Object.defineProperty( navigator, 'connection', {
				value: { saveData: false, effectiveType: '2g' },
				configurable: true,
			} );

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toContain( 'too slow' );
		} );

		it( 'returns not supported when connection is slow-2g', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			Object.defineProperty( navigator, 'connection', {
				value: {
					saveData: false,
					effectiveType: 'slow-2g',
				},
				configurable: true,
			} );

			const result = detectClientSideMediaSupport();

			expect( result.supported ).toBe( false );
			expect( result.reason ).toContain( 'too slow' );
		} );

		it( 'returns not supported when CSP blocks blob workers', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

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

			const result1 = detectClientSideMediaSupport();
			expect( result1.supported ).toBe( true );

			// Now set WebAssembly to undefined - cached result should still be returned.
			// @ts-ignore - Intentionally setting WebAssembly to undefined for testing.
			global.WebAssembly = undefined;

			const result2 = detectClientSideMediaSupport();
			expect( result2.supported ).toBe( true );
			expect( result2 ).toBe( result1 ); // Same object reference.
		} );
	} );

	describe( 'isClientSideMediaSupported', () => {
		it( 'returns true when all features are available', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			expect( isClientSideMediaSupported() ).toBe( true );
		} );

		it( 'returns false when features are unavailable', () => {
			// @ts-ignore - Intentionally setting WebAssembly to undefined for testing.
			global.WebAssembly = undefined;

			expect( isClientSideMediaSupported() ).toBe( false );
		} );
	} );

	describe( 'clearFeatureDetectionCache', () => {
		it( 'clears the cached result', () => {
			global.WebAssembly = originalWebAssembly;
			global.SharedArrayBuffer = originalSharedArrayBuffer;

			const result1 = detectClientSideMediaSupport();
			expect( result1.supported ).toBe( true );

			// Clear cache and set WebAssembly to undefined.
			clearFeatureDetectionCache();
			// @ts-ignore - Intentionally setting WebAssembly to undefined for testing.
			global.WebAssembly = undefined;

			const result2 = detectClientSideMediaSupport();
			expect( result2.supported ).toBe( false );
		} );
	} );
} );
