/**
 * External dependencies
 */
import { act, render, screen } from 'test/helpers';

/**
 * WordPress dependencies
 */
import {
	requestConnectionStatus,
	subscribeConnectionStatus,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import OfflineStatus from '../index';
import { AccessibilityInfo } from 'react-native';

jest.mock( '../style.native.scss', () => ( {
	'offline--icon': {
		fill: '',
	},
} ) );

describe( 'when network connectivity is unavailable', () => {
	beforeAll( () => {
		requestConnectionStatus.mockImplementation( ( callback ) => {
			callback( false );
			return { remove: jest.fn() };
		} );
	} );

	it( 'should display a helpful message', () => {
		render( <OfflineStatus /> );

		expect( screen.getByText( 'Working Offline' ) ).toBeVisible();
	} );

	it( 'should display an accessible message', () => {
		render( <OfflineStatus /> );

		expect(
			screen.getByLabelText( 'Network connection lost, working offline' )
		).toBeVisible();
	} );

	it( 'should announce network status', () => {
		render( <OfflineStatus /> );

		expect(
			AccessibilityInfo.announceForAccessibility
		).toHaveBeenCalledWith( 'Network connection lost, working offline' );
	} );

	it( 'should announce changes to network status', () => {
		let subscriptionCallback;
		subscribeConnectionStatus.mockImplementation( ( callback ) => {
			subscriptionCallback = callback;
			return { remove: jest.fn() };
		} );
		render( <OfflineStatus /> );

		act( () => subscriptionCallback( { isConnected: false } ) );

		expect(
			AccessibilityInfo.announceForAccessibility
		).toHaveBeenCalledWith( 'Network connection lost, working offline' );
	} );
} );

describe( 'when network connectivity is available', () => {
	beforeAll( () => {
		requestConnectionStatus.mockImplementation( ( callback ) => {
			callback( true );
			return { remove: jest.fn() };
		} );
	} );

	it( 'should not display a helpful message', () => {
		render( <OfflineStatus /> );

		expect( screen.queryByText( 'Working Offline' ) ).toBeNull();
	} );

	it( 'should not announce network status', () => {
		render( <OfflineStatus /> );

		expect(
			AccessibilityInfo.announceForAccessibility
		).not.toHaveBeenCalled();
	} );

	it( 'should announce changes to network status', () => {
		let subscriptionCallback;
		subscribeConnectionStatus.mockImplementation( ( callback ) => {
			subscriptionCallback = callback;
			return { remove: jest.fn() };
		} );
		render( <OfflineStatus /> );

		act( () => subscriptionCallback( { isConnected: false } ) );

		expect(
			AccessibilityInfo.announceForAccessibility
		).toHaveBeenCalledWith( 'Network connection lost, working offline' );
	} );
} );
