/**
 * WordPress dependencies
 */
import * as BlockFunctions from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	downloadBlock,
	installBlock,
	uninstallBlock,
} from '../actions';
import * as Controls from '../controls';

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
	const getBlockTypeMock = jest.spyOn( BlockFunctions, 'getBlockTypes' );
	jest.spyOn( Controls, 'apiFetch' );
	jest.spyOn( Controls, 'loadAssets' );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	afterAll( () => {
		jest.resetAllMocks();
	} );

	const testApiFetch = ( generator ) => {
		return expect(
			generator.next( { success: true } ).value.type,
		).toEqual( ACTIONS.apiFetch );
	};

	const expectTest = ( hasCall, noCall ) => {
		expect( hasCall.mock.calls.length ).toBe( 1 );
		expect( noCall.mock.calls.length ).toBe( 0 );
	};

	const expectSuccess = ( onSuccess, onError ) => {
		expectTest( onSuccess, onError );
	};

	const expectError = ( onSuccess, onError ) => {
		expectTest( onError, onSuccess );
	};

	const runSuccessActionCall = ( generatorFunc, blockTypeAction ) => {
		const onSuccess = jest.fn();
		const onError = jest.fn();

		const generator = generatorFunc( item, onSuccess, onError );

		// It triggers API_FETCH that wraps @wordpress/api-fetch
		testApiFetch( generator );

		// It triggers ADD_INSTALLED_BLOCK_TYPE
		expect(
			generator.next( { success: true } ).value.type,
		).toEqual( blockTypeAction );

		// Call onSuccess
		generator.next();

		expectSuccess( onSuccess, onError );
	};

	const runErrorActionCall = ( generatorFunc ) => {
		const onSuccess = jest.fn();
		const onError = jest.fn();

		const uninstallBlockGenerator = generatorFunc( item, onSuccess, onError );

		// It triggers API_FETCH that wraps @wordpress/api-fetch
		testApiFetch( uninstallBlockGenerator );

		// Resolve fetch and make it fail
		uninstallBlockGenerator.next( { success: false } );

		expectError( onSuccess, onError );
	};

	describe( 'downloadBlock', () => {
		it( 'should throw error if the plugin has no assets', () => {
			const onSuccess = jest.fn();
			const onError = jest.fn();

			const generator = downloadBlock( {
				assets: [],
			}, onSuccess, onError );

			// Trigger the check of whether the block plugin has assets
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

			// Trigger the block check via getBlockTypes
			generator.next();

			expectError( onSuccess, onError );
		} );
	} );

	describe( 'installBlock', () => {
		it( 'should install a block successfully', () => {
			runSuccessActionCall( installBlock, ACTIONS.addInstalledBlockType );
		} );

		it( 'should trigger error state when error is thrown', () => {
			runErrorActionCall( installBlock );
		} );
	} );

	describe( 'uninstallBlock', () => {
		it( 'should uninstall a block successfully', () => {
			runSuccessActionCall( uninstallBlock, ACTIONS.removeInstalledBlockType );
		} );

		it( 'should trigger error state when error is thrown', () => {
			runErrorActionCall( uninstallBlock );
		} );
	} );
} );
