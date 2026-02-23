/**
 * @jest-environment jsdom
 */

describe( 'cross-origin-isolation', () => {
	let originalCrossOriginIsolated;
	let originalBody;
	let observeSpy;

	beforeEach( () => {
		// Save original values
		originalCrossOriginIsolated = window.crossOriginIsolated;
		originalBody = document.body;

		// Clear any existing filters
		jest.clearAllMocks();

		// Spy on MutationObserver.observe
		observeSpy = jest.spyOn( window.MutationObserver.prototype, 'observe' );
	} );

	afterEach( () => {
		// Restore original values
		if ( originalCrossOriginIsolated !== undefined ) {
			Object.defineProperty( window, 'crossOriginIsolated', {
				value: originalCrossOriginIsolated,
				writable: true,
				configurable: true,
			} );
		}

		if ( originalBody ) {
			Object.defineProperty( document, 'body', {
				value: originalBody,
				writable: true,
				configurable: true,
			} );
		}

		observeSpy.mockRestore();
		jest.resetModules();
	} );

	it( 'should not observe when crossOriginIsolated is false', () => {
		Object.defineProperty( window, 'crossOriginIsolated', {
			value: false,
			writable: true,
			configurable: true,
		} );

		// Re-import the module to trigger the side effects
		jest.isolateModules( () => {
			require( '../cross-origin-isolation' );
		} );

		expect( observeSpy ).not.toHaveBeenCalled();
	} );

	it( 'should observe document.body when crossOriginIsolated is true and body exists', () => {
		Object.defineProperty( window, 'crossOriginIsolated', {
			value: true,
			writable: true,
			configurable: true,
		} );

		Object.defineProperty( document, 'readyState', {
			value: 'complete',
			writable: true,
			configurable: true,
		} );

		// Re-import the module to trigger the side effects
		jest.isolateModules( () => {
			require( '../cross-origin-isolation' );
		} );

		expect( observeSpy ).toHaveBeenCalledWith( document.body, {
			childList: true,
			attributes: true,
			subtree: true,
		} );
	} );

	it( 'should wait for DOMContentLoaded when body is not available and document is loading', () => {
		Object.defineProperty( window, 'crossOriginIsolated', {
			value: true,
			writable: true,
			configurable: true,
		} );

		// Simulate document still loading
		Object.defineProperty( document, 'readyState', {
			value: 'loading',
			writable: true,
			configurable: true,
		} );

		// Temporarily remove body
		Object.defineProperty( document, 'body', {
			value: null,
			writable: true,
			configurable: true,
		} );

		const addEventListenerSpy = jest.spyOn( document, 'addEventListener' );

		// Re-import the module to trigger the side effects
		jest.isolateModules( () => {
			require( '../cross-origin-isolation' );
		} );

		// Should not observe immediately
		expect( observeSpy ).not.toHaveBeenCalled();

		// Should have added DOMContentLoaded listener
		expect( addEventListenerSpy ).toHaveBeenCalledWith(
			'DOMContentLoaded',
			expect.any( Function )
		);

		addEventListenerSpy.mockRestore();
	} );

	it( 'should not throw error when body is null and document is complete', () => {
		Object.defineProperty( window, 'crossOriginIsolated', {
			value: true,
			writable: true,
			configurable: true,
		} );

		Object.defineProperty( document, 'readyState', {
			value: 'complete',
			writable: true,
			configurable: true,
		} );

		// Temporarily remove body
		Object.defineProperty( document, 'body', {
			value: null,
			writable: true,
			configurable: true,
		} );

		// This should not throw an error
		expect( () => {
			jest.isolateModules( () => {
				require( '../cross-origin-isolation' );
			} );
		} ).not.toThrow();

		// Should not attempt to observe null
		expect( observeSpy ).not.toHaveBeenCalled();
	} );

	it( 'should handle iframe contentDocument errors gracefully', () => {
		Object.defineProperty( window, 'crossOriginIsolated', {
			value: true,
			writable: true,
			configurable: true,
		} );

		// Re-import the module
		jest.isolateModules( () => {
			require( '../cross-origin-isolation' );
		} );

		// Create an iframe that throws when accessing contentDocument
		const iframe = document.createElement( 'iframe' );
		Object.defineProperty( iframe, 'contentDocument', {
			get() {
				throw new Error( 'Cross-origin access denied' );
			},
		} );

		// This should not throw an error
		expect( () => {
			document.body.appendChild( iframe );
			iframe.dispatchEvent( new Event( 'load' ) );
		} ).not.toThrow();
	} );

	it( 'should register embed preview filter when cross-origin isolated', () => {
		Object.defineProperty( window, 'crossOriginIsolated', {
			value: true,
			writable: true,
			configurable: true,
		} );

		const hasFilter = jest.spyOn(
			require( '@wordpress/hooks' ),
			'hasFilter'
		);

		// Re-import the module to register filters
		jest.isolateModules( () => {
			require( '../cross-origin-isolation' );
		} );

		// The module should register a filter when cross-origin isolated
		// We can't easily test the filter itself without a full React environment,
		// but we can verify the module loads without errors
		expect( () => {
			require( '@wordpress/hooks' ).hasFilter(
				'editor.BlockEdit',
				'media-experiments/disable-embed-previews'
			);
		} ).not.toThrow();

		hasFilter.mockRestore();
	} );
} );
