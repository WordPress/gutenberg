/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useNetworkReconnect from '../use-network-reconnect';

const mockPauseQueue = jest.fn();
const mockResumeQueue = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	useRegistry: jest.fn(),
} ) );

jest.mock( '@wordpress/upload-media', () => ( {
	store: 'core/upload-media',
} ) );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: jest.fn( () => ( {
		pauseQueue: mockPauseQueue,
		resumeQueue: mockResumeQueue,
	} ) ),
} ) );

describe( 'useNetworkReconnect', () => {
	const originalAddEventListener = window.addEventListener;
	const originalRemoveEventListener = window.removeEventListener;
	let listeners;

	beforeEach( () => {
		mockPauseQueue.mockClear();
		mockResumeQueue.mockClear();
		listeners = {};
		window.addEventListener = jest.fn( ( event, cb ) => {
			listeners[ event ] = cb;
		} );
		window.removeEventListener = jest.fn( ( event ) => {
			delete listeners[ event ];
		} );
		useRegistry.mockReturnValue( {
			dispatch: jest.fn( () => ( {} ) ),
		} );
	} );

	afterEach( () => {
		window.addEventListener = originalAddEventListener;
		window.removeEventListener = originalRemoveEventListener;
		delete window.__clientSideMediaProcessing;
	} );

	it( 'does nothing when client-side media processing is disabled', () => {
		window.__clientSideMediaProcessing = false;
		renderHook( () => useNetworkReconnect() );

		expect( window.addEventListener ).not.toHaveBeenCalled();
	} );

	it( 'does nothing when the flag is undefined', () => {
		renderHook( () => useNetworkReconnect() );

		expect( window.addEventListener ).not.toHaveBeenCalled();
	} );

	it( 'registers offline and online listeners when enabled', () => {
		window.__clientSideMediaProcessing = true;
		renderHook( () => useNetworkReconnect() );

		expect( window.addEventListener ).toHaveBeenCalledWith(
			'offline',
			expect.any( Function )
		);
		expect( window.addEventListener ).toHaveBeenCalledWith(
			'online',
			expect.any( Function )
		);
	} );

	it( 'pauses the queue when the offline event fires', () => {
		window.__clientSideMediaProcessing = true;
		renderHook( () => useNetworkReconnect() );

		listeners.offline();

		expect( mockPauseQueue ).toHaveBeenCalledTimes( 1 );
		expect( mockResumeQueue ).not.toHaveBeenCalled();
	} );

	it( 'resumes the queue when the online event fires', () => {
		window.__clientSideMediaProcessing = true;
		renderHook( () => useNetworkReconnect() );

		listeners.online();

		expect( mockResumeQueue ).toHaveBeenCalledTimes( 1 );
		expect( mockPauseQueue ).not.toHaveBeenCalled();
	} );

	it( 'handles multiple offline/online cycles', () => {
		window.__clientSideMediaProcessing = true;
		renderHook( () => useNetworkReconnect() );

		listeners.offline();
		listeners.online();
		listeners.offline();
		listeners.online();

		expect( mockPauseQueue ).toHaveBeenCalledTimes( 2 );
		expect( mockResumeQueue ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'removes the listeners on unmount', () => {
		window.__clientSideMediaProcessing = true;
		const { unmount } = renderHook( () => useNetworkReconnect() );

		unmount();

		expect( window.removeEventListener ).toHaveBeenCalledWith(
			'offline',
			expect.any( Function )
		);
		expect( window.removeEventListener ).toHaveBeenCalledWith(
			'online',
			expect.any( Function )
		);
		expect( listeners.offline ).toBeUndefined();
		expect( listeners.online ).toBeUndefined();
	} );
} );
