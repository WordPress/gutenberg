/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import * as actions from '../actions';

jest.mock( '@wordpress/data-controls' );

select.mockImplementation( ( ...args ) => {
	const { select: actualSelect } = jest.requireActual(
		'@wordpress/data-controls'
	);
	return actualSelect( ...args );
} );

dispatch.mockImplementation( ( ...args ) => {
	const { dispatch: actualDispatch } = jest.requireActual(
		'@wordpress/data-controls'
	);
	return actualDispatch( ...args );
} );

describe( 'Actions', () => {
	describe( 'fetchReusableBlocks', () => {
		it( 'should return the FETCH_REUSABLE_BLOCKS action', () => {
			expect( actions.__experimentalFetchReusableBlocks() ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
			} );
		} );

		it( 'should take an optional id argument', () => {
			expect( actions.__experimentalFetchReusableBlocks( 123 ) ).toEqual(
				{
					type: 'FETCH_REUSABLE_BLOCKS',
					id: 123,
				}
			);
		} );
	} );

	describe( 'saveReusableBlock', () => {
		it( 'should return the SAVE_REUSABLE_BLOCK action', () => {
			expect( actions.__experimentalSaveReusableBlock( 123 ) ).toEqual( {
				type: 'SAVE_REUSABLE_BLOCK',
				id: 123,
			} );
		} );
	} );

	describe( 'deleteReusableBlock', () => {
		it( 'should return the DELETE_REUSABLE_BLOCK action', () => {
			expect( actions.__experimentalDeleteReusableBlock( 123 ) ).toEqual(
				{
					type: 'DELETE_REUSABLE_BLOCK',
					id: 123,
				}
			);
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		it( 'should return the CONVERT_BLOCK_TO_STATIC action', () => {
			const clientId = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect(
				actions.__experimentalConvertBlockToStatic( clientId )
			).toEqual( {
				type: 'CONVERT_BLOCK_TO_STATIC',
				clientId,
			} );
		} );
	} );

	describe( 'convertBlockToReusable', () => {
		it( 'should return the CONVERT_BLOCK_TO_REUSABLE action', () => {
			const clientId = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect(
				actions.__experimentalConvertBlockToReusable( clientId )
			).toEqual( {
				type: 'CONVERT_BLOCK_TO_REUSABLE',
				clientIds: [ clientId ],
			} );
		} );
	} );
} );
