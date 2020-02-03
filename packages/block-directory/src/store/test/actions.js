/**
 * WordPress dependencies
 */
import * as blockFunctions from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { downloadBlock, installBlock } from '../actions';
import * as controls from '../controls';

const ACTIONS = {
	apiFetch: 'API_FETCH',
	addInstalledBlockType: 'ADD_INSTALLED_BLOCK_TYPE',
	removeInstalledBlockType: 'REMOVE_INSTALLED_BLOCK_TYPE',
};

jest.mock( '@wordpress/blocks' );

describe( 'actions', () => {
	const item = { id: 'block/block', name: 'Test Block' };
	const blockPlugin = {
		assets: [ 'http://www.wordpress.org/plugins/fakeasset.js' ],
	};
	const getBlockTypeMock = jest.spyOn( blockFunctions, 'getBlockTypes' );
	jest.spyOn( controls, 'apiFetch' );
	jest.spyOn( controls, 'loadAssets' );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	afterAll( () => {
		jest.resetAllMocks();
	} );

	const callsTheApi = ( generator ) => {
		return expect( generator.next( { success: true } ).value.type ).toEqual(
			ACTIONS.apiFetch
		);
	};

	const expectTest = ( hasCall, noCall ) => {
		expect( hasCall ).toHaveBeenCalledTimes( 1 );
		expect( noCall ).toHaveBeenCalledTimes( 0 );
	};

	const expectSuccess = ( onSuccess, onError ) => {
		expectTest( onSuccess, onError );
	};

	const expectError = ( onSuccess, onError ) => {
		expectTest( onError, onSuccess );
	};

	describe( 'downloadBlock', () => {
		it( 'should throw error if the plugin has no assets', () => {
			const onSuccess = jest.fn();
			const onError = jest.fn();

			const generator = downloadBlock(
				{
					assets: [],
				},
				onSuccess,
				onError
			);

			// Move onto the onError callback
			generator.next();

			expectError( onSuccess, onError );
		} );

		it( 'should call on success function', () => {
			const onSuccess = jest.fn();
			const onError = jest.fn();

			// The block is registered
			getBlockTypeMock.mockReturnValue( [ item ] );

			const generator = downloadBlock( blockPlugin, onSuccess, onError );

			// Trigger the loading of assets
			generator.next();

			// Trigger the block check via getBlockTypes
			generator.next();

			expectSuccess( onSuccess, onError );
		} );

		it( 'should call on error when no blocks are returned', () => {
			const onSuccess = jest.fn();
			const onError = jest.fn();

			// The block is not registered
			getBlockTypeMock.mockReturnValue( [] );

			const generator = downloadBlock( blockPlugin, onSuccess, onError );

			// Trigger the loading of assets
			generator.next();

			//Complete
			generator.next();

			expectError( onSuccess, onError );
		} );
	} );

	describe( 'installBlock', () => {
		it( 'should install a block successfully', () => {
			const onSuccess = jest.fn();
			const onError = jest.fn();

			const generator = installBlock( item, onSuccess, onError );

			// It triggers API_FETCH that wraps @wordpress/api-fetch
			callsTheApi( generator );

			// It triggers ADD_INSTALLED_BLOCK_TYPE
			expect( generator.next( { success: true } ).value.type ).toEqual(
				ACTIONS.addInstalledBlockType
			);

			// Move on to success
			generator.next();

			expectSuccess( onSuccess, onError );
		} );

		it( 'should trigger error state when error is thrown', () => {
			const onSuccess = jest.fn();
			const onError = jest.fn();

			const generator = installBlock( item, onSuccess, onError );

			// It triggers API_FETCH that wraps @wordpress/api-fetch
			callsTheApi( generator );

			// Move on to error
			generator.next();

			expectError( onSuccess, onError );
		} );
	} );
} );
