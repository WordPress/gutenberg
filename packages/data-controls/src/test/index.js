/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

/**
 * Internal dependencies
 */
import { controls } from '../index';

describe( 'controls', () => {
	describe( 'API_FETCH', () => {
		afterEach( () => {
			triggerFetch.mockClear();
		} );
		it( 'invokes the triggerFetch function', () => {
			controls.API_FETCH( { request: '' } );
			expect( triggerFetch ).toHaveBeenCalledTimes( 1 );
		} );
		it( 'invokes the triggerFetch funcion with the passed in request', () => {
			controls.API_FETCH( { request: 'foo' } );
			expect( triggerFetch ).toHaveBeenCalledWith( 'foo' );
		} );
	} );
	describe( 'SELECT', () => {
		const selectorWithUndefinedResolver = jest.fn();
		const selectorWithResolver = jest.fn();
		selectorWithResolver.hasResolver = true;
		const selectorWithFalseResolver = jest.fn();
		selectorWithFalseResolver.hasResolver = false;
		const hasFinishedResolution = jest.fn();
		const unsubscribe = jest.fn();
		let subscribedCallback;
		const registryMock = {
			select: ( storeKey ) => {
				const stores = {
					mockStore: {
						selectorWithResolver,
						selectorWithUndefinedResolver,
						selectorWithFalseResolver,
					},
					'core/data': {
						hasFinishedResolution,
					},
				};
				return stores[ storeKey ];
			},
			subscribe: jest.fn(
				( subscribeCallback ) => {
					subscribedCallback = subscribeCallback;
					return unsubscribe;
				}
			),
		};
		const getSelectorArgs = ( storeKey, selectorName, ...args ) => (
			{ storeKey, selectorName, args }
		);
		beforeEach( () => {
			selectorWithUndefinedResolver.mockReturnValue( 'foo' );
			selectorWithFalseResolver.mockReturnValue( 'bar' );
			selectorWithResolver.mockReturnValue( 'resolved' );
			hasFinishedResolution.mockReturnValue( false );
		} );
		afterEach( () => {
			selectorWithUndefinedResolver.mockClear();
			selectorWithResolver.mockClear();
			selectorWithFalseResolver.mockClear();
			hasFinishedResolution.mockClear();
			unsubscribe.mockClear();
		} );
		it( 'invokes selector with undefined resolver', () => {
			const testControl = controls.SELECT( registryMock );
			const value = testControl( getSelectorArgs(
				'mockStore',
				'selectorWithUndefinedResolver'
			) );
			expect( value ).toBe( 'foo' );
			expect( selectorWithUndefinedResolver ).toHaveBeenCalled();
			expect( hasFinishedResolution ).not.toHaveBeenCalled();
		} );
		it( 'invokes selector with resolver set to false', () => {
			const testControl = controls.SELECT( registryMock );
			const value = testControl( getSelectorArgs(
				'mockStore',
				'selectorWithFalseResolver'
			) );
			expect( value ).toBe( 'bar' );
			expect( selectorWithFalseResolver ).toHaveBeenCalled();
			expect( hasFinishedResolution ).not.toHaveBeenCalled();
		} );
		describe( 'invokes selector with resolver set to true', () => {
			const testControl = controls.SELECT( registryMock );
			it( 'returns a promise', () => {
				const value = testControl( getSelectorArgs(
					'mockStore',
					'selectorWithResolver'
				) );
				expect( value ).toBeInstanceOf( Promise );
				expect( hasFinishedResolution ).toHaveBeenCalled();
				expect( registryMock.subscribe ).toHaveBeenCalled();
			} );
			it( 'selector with resolver resolves to expected result when ' +
				'finished', async () => {
				const value = testControl( getSelectorArgs(
					'mockStore',
					'selectorWithResolver'
				) );
				hasFinishedResolution.mockReturnValue( true );
				subscribedCallback();
				await expect( value ).resolves.toBe( 'resolved' );
				expect( unsubscribe ).toHaveBeenCalled();
			} );
		} );
	} );
	describe( 'DISPATCH', () => {
		const mockDispatch = jest.fn();
		const registryMock = {
			dispatch: ( storeKey ) => {
				const stores = {
					mockStore: {
						mockDispatch,
					},
				};
				return stores[ storeKey ];
			},
		};
		beforeEach( () => {
			mockDispatch.mockReturnValue( 'foo' );
		} );
		afterEach( () => {
			mockDispatch.mockClear();
		} );
		it( 'invokes dispatch action', () => {
			const testControl = controls.DISPATCH( registryMock );
			const value = testControl( {
				storeKey: 'mockStore',
				actionName: 'mockDispatch',
				args: [],
			} );
			expect( value ).toBe( 'foo' );
			expect( mockDispatch ).toHaveBeenCalled();
		} );
	} );
} );
