/**
 * External dependencies
 */
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';

/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { TypedAwareness } from '../typed-awareness';
import type { EnhancedState } from '../types';

interface TestState {
	name: string;
	count: number;
	isActive: boolean;
}

describe( 'TypedAwareness', () => {
	let doc: Y.Doc;
	let awareness: TypedAwareness< TestState >;

	beforeEach( () => {
		doc = new Y.Doc();
		awareness = new TypedAwareness< TestState >( doc );
	} );

	afterEach( () => {
		doc.destroy();
	} );

	describe( 'getStates', () => {
		test( 'should return empty map initially', () => {
			const states = awareness.getStates();
			// There should be at least one state (the local client)
			expect( states ).toBeInstanceOf( Map );
		} );

		test( 'should return map with correct type', () => {
			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 42 );

			const states = awareness.getStates();
			const localState = states.get( awareness.clientID );

			expect( localState?.name ).toBe( 'Test' );
			expect( localState?.count ).toBe( 42 );
		} );
	} );

	describe( 'getLocalStateField', () => {
		test( 'should return null for non-existent field', () => {
			const result = awareness.getLocalStateField( 'name' );
			expect( result ).toBeNull();
		} );

		test( 'should return field value after setting', () => {
			awareness.setLocalStateField( 'name', 'John' );
			const result = awareness.getLocalStateField( 'name' );
			expect( result ).toBe( 'John' );
		} );

		test( 'should return correct type for number field', () => {
			awareness.setLocalStateField( 'count', 100 );
			const result = awareness.getLocalStateField( 'count' );
			expect( result ).toBe( 100 );
		} );

		test( 'should return correct type for boolean field', () => {
			awareness.setLocalStateField( 'isActive', true );
			const result = awareness.getLocalStateField( 'isActive' );
			expect( result ).toBe( true );
		} );

		test( 'should return null when local state is null', () => {
			// Clear local state
			awareness.setLocalState( null );
			const result = awareness.getLocalStateField( 'name' );
			expect( result ).toBeNull();
		} );
	} );

	describe( 'setLocalStateField', () => {
		test( 'should set string field', () => {
			awareness.setLocalStateField( 'name', 'Alice' );
			expect( awareness.getLocalStateField( 'name' ) ).toBe( 'Alice' );
		} );

		test( 'should set number field', () => {
			awareness.setLocalStateField( 'count', 42 );
			expect( awareness.getLocalStateField( 'count' ) ).toBe( 42 );
		} );

		test( 'should set boolean field', () => {
			awareness.setLocalStateField( 'isActive', false );
			expect( awareness.getLocalStateField( 'isActive' ) ).toBe( false );
		} );

		test( 'should update existing field value', () => {
			awareness.setLocalStateField( 'name', 'First' );
			awareness.setLocalStateField( 'name', 'Second' );
			expect( awareness.getLocalStateField( 'name' ) ).toBe( 'Second' );
		} );

		test( 'should preserve other fields when setting one field', () => {
			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 10 );

			expect( awareness.getLocalStateField( 'name' ) ).toBe( 'Test' );
			expect( awareness.getLocalStateField( 'count' ) ).toBe( 10 );
		} );
	} );

	describe( 'clientID', () => {
		test( 'should have a numeric clientID', () => {
			expect( typeof awareness.clientID ).toBe( 'number' );
		} );

		test( 'should have the same clientID as the doc', () => {
			expect( awareness.clientID ).toBe( doc.clientID );
		} );
	} );
} );

describe( 'EnhancedState type', () => {
	test( 'should include base state properties and metadata', () => {
		// This is a compile-time type check
		const enhancedState: EnhancedState< TestState > = {
			name: 'Test',
			count: 5,
			isActive: true,
			clientId: 123,
			isConnected: true,
			isMe: false,
		};

		expect( enhancedState.name ).toBe( 'Test' );
		expect( enhancedState.count ).toBe( 5 );
		expect( enhancedState.isActive ).toBe( true );
		expect( enhancedState.clientId ).toBe( 123 );
		expect( enhancedState.isConnected ).toBe( true );
		expect( enhancedState.isMe ).toBe( false );
	} );
} );
