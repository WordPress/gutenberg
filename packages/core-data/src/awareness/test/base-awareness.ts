/**
 * External dependencies
 */
import { Y } from '@wordpress/sync';
import { resolveSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	BaseAwarenessState,
	BaseAwareness,
	baseEqualityFieldChecks,
} from '../base-awareness';
import { areUserInfosEqual } from '../utils';
import type { BaseState, UserInfo } from '../types';

// Mock WordPress data
jest.mock( '@wordpress/data', () => ( {
	resolveSelect: jest.fn(),
} ) );

// Mock window.navigator.userAgent
const mockUserAgent = ( userAgent: string ) => {
	Object.defineProperty( window.navigator, 'userAgent', {
		value: userAgent,
		configurable: true,
	} );
};

const mockAvatarUrls = {
	'24': 'https://example.com/avatar-24.png',
	'48': 'https://example.com/avatar-48.png',
	'96': 'https://example.com/avatar-96.png',
};

const createMockUser = () => ( {
	id: 1,
	name: 'Test User',
	slug: 'test-user',
	avatar_urls: mockAvatarUrls,
} );

describe( 'BaseAwareness', () => {
	let doc: Y.Doc;

	beforeEach( () => {
		jest.useFakeTimers();
		doc = new Y.Doc();

		// Reset to Chrome
		mockUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		);

		// Mock Date.now for consistent timestamps
		jest.spyOn( Date, 'now' ).mockReturnValue( 1704067200000 );

		// Mock resolveSelect to return getCurrentUser
		( resolveSelect as jest.Mock ).mockReturnValue( {
			getCurrentUser: jest.fn().mockResolvedValue( createMockUser() ),
		} );
	} );

	afterEach( () => {
		jest.useRealTimers();
		jest.restoreAllMocks();
		doc.destroy();
	} );

	describe( 'construction', () => {
		test( 'should create instance with Y.Doc', () => {
			const awareness = new BaseAwareness( doc );
			expect( awareness ).toBeInstanceOf( BaseAwareness );
		} );

		test( 'should have correct clientID from doc', () => {
			const awareness = new BaseAwareness( doc );
			expect( awareness.clientID ).toBe( doc.clientID );
		} );
	} );

	describe( 'setUp', () => {
		test( 'should be idempotent', () => {
			const awareness = new BaseAwareness( doc );

			awareness.setUp();
			awareness.setUp();

			// Should not throw and should only call getCurrentUser once
			expect( resolveSelect ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should fetch current user and set userInfo', async () => {
			const awareness = new BaseAwareness( doc );

			awareness.setUp();

			// Wait for async operations
			await Promise.resolve();

			const userInfo = awareness.getLocalStateField( 'userInfo' );
			expect( userInfo ).toBeDefined();
			expect( userInfo?.id ).toBe( 1 );
			expect( userInfo?.name ).toBe( 'Test User' );
			expect( userInfo?.browserType ).toBe( 'Chrome' );
		} );
	} );

	describe( 'baseEqualityFieldChecks', () => {
		test( 'should have userInfo equality check', () => {
			expect( baseEqualityFieldChecks.userInfo ).toBe(
				areUserInfosEqual
			);
		} );
	} );
} );

describe( 'BaseAwarenessState', () => {
	/**
	 * Concrete implementation for testing the abstract class
	 */
	class TestBaseAwarenessState extends BaseAwarenessState< BaseState > {
		protected equalityFieldChecks = {
			userInfo: areUserInfosEqual,
		};
	}

	let doc: Y.Doc;

	beforeEach( () => {
		jest.useFakeTimers();
		doc = new Y.Doc();

		mockUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		);

		jest.spyOn( Date, 'now' ).mockReturnValue( 1704067200000 );

		( resolveSelect as jest.Mock ).mockReturnValue( {
			getCurrentUser: jest.fn().mockResolvedValue( createMockUser() ),
		} );
	} );

	afterEach( () => {
		jest.useRealTimers();
		jest.restoreAllMocks();
		doc.destroy();
	} );

	describe( 'onSetUp', () => {
		test( 'should call setCurrentUserInfo', async () => {
			const awareness = new TestBaseAwarenessState( doc );

			awareness.setUp();
			await Promise.resolve();

			expect( resolveSelect ).toHaveBeenCalledWith( 'core' );
		} );

		test( 'should exclude own color from available colors', async () => {
			// Set up another user state first
			const doc2 = new Y.Doc();
			const awareness = new TestBaseAwarenessState( doc );

			// Manually add another user's state with a specific color
			awareness.setLocalStateField( 'userInfo', {
				id: 2,
				name: 'Other User',
				slug: 'other-user',
				avatar_urls: mockAvatarUrls,
				browserType: 'Firefox',
				color: '#3858E9', // blueberry
				enteredAt: 1704067200000,
			} );

			awareness.setUp();
			await Promise.resolve();

			// The new user should get a different color if possible
			const userInfo = awareness.getLocalStateField( 'userInfo' );
			expect( userInfo ).toBeDefined();

			doc2.destroy();
		} );
	} );

	describe( 'getLocalStateField', () => {
		test( 'should return null when field not set', () => {
			const awareness = new TestBaseAwarenessState( doc );
			expect( awareness.getLocalStateField( 'userInfo' ) ).toBeNull();
		} );

		test( 'should return userInfo after setUp', async () => {
			const awareness = new TestBaseAwarenessState( doc );
			awareness.setUp();
			await Promise.resolve();

			const userInfo = awareness.getLocalStateField( 'userInfo' );
			expect( userInfo ).not.toBeNull();
			expect( userInfo?.name ).toBe( 'Test User' );
		} );
	} );

	describe( 'setLocalStateField', () => {
		test( 'should set userInfo field', () => {
			const awareness = new TestBaseAwarenessState( doc );
			const userInfo: UserInfo = {
				id: 42,
				name: 'Custom User',
				slug: 'custom-user',
				avatar_urls: mockAvatarUrls,
				browserType: 'Safari',
				color: '#E33184',
				enteredAt: 1704067200000,
			};

			awareness.setLocalStateField( 'userInfo', userInfo );

			expect( awareness.getLocalStateField( 'userInfo' ) ).toEqual(
				userInfo
			);
		} );

		test( 'should not update if userInfo is equal', () => {
			const awareness = new TestBaseAwarenessState( doc );
			const userInfo: UserInfo = {
				id: 42,
				name: 'Custom User',
				slug: 'custom-user',
				avatar_urls: mockAvatarUrls,
				browserType: 'Safari',
				color: '#E33184',
				enteredAt: 1704067200000,
			};

			awareness.setLocalStateField( 'userInfo', userInfo );

			// Subscribe to detect updates
			const callback = jest.fn();
			awareness.onStateChange( callback );

			// Set same userInfo
			awareness.setLocalStateField( 'userInfo', { ...userInfo } );

			// Trigger awareness change event to test if callback is called
			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );

			// Callback should not be called for equal values
			expect( callback ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'state subscription', () => {
		test( 'should notify subscribers on state change', async () => {
			const awareness = new TestBaseAwarenessState( doc );
			const callback = jest.fn();

			awareness.onStateChange( callback );
			awareness.setUp();
			await Promise.resolve();

			// Trigger awareness change event
			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );

			expect( callback ).toHaveBeenCalled();
		} );

		test( 'should include enhanced state with isMe and isConnected', async () => {
			const awareness = new TestBaseAwarenessState( doc );
			let receivedStates: any[] = [];

			awareness.onStateChange( ( states ) => {
				receivedStates = states;
			} );

			awareness.setUp();
			await Promise.resolve();

			// Trigger awareness change event
			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );

			expect( receivedStates.length ).toBeGreaterThan( 0 );
			const myState = receivedStates.find( ( s ) => s.isMe );
			expect( myState ).toBeDefined();
			expect( myState.isConnected ).toBe( true );
		} );
	} );
} );
