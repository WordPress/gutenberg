/**
 * Internal dependencies
 */
import {
	getErrorNotices,
	getErrorNoticeForBlock,
	getInstalledBlockTypes,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'getInstalledBlockTypes', () => {
		it( 'should retrieve the block types that are installed', () => {
			const blockTypes = [ 'fake-type' ];
			const state = {
				blockManagement: {
					installedBlockTypes: blockTypes,
				},
			};
			const installedBlockTypes = getInstalledBlockTypes( state );
			expect( installedBlockTypes ).toEqual( blockTypes );
		} );
	} );

	describe( 'getErrorNotices', () => {
		const state = {
			errorNotices: {
				'block/has-error': 'Error notice',
			},
		};

		it( 'should retrieve all error notices', () => {
			const errorNotices = getErrorNotices( state );
			expect( errorNotices ).toEqual( {
				'block/has-error': 'Error notice',
			} );
		} );
	} );

	describe( 'getErrorNoticeForBlock', () => {
		const state = {
			errorNotices: {
				'block/has-error': 'Error notice',
			},
		};

		it( 'should retrieve the error notice for a block that has one', () => {
			const errorNotices = getErrorNoticeForBlock(
				state,
				'block/has-error'
			);
			expect( errorNotices ).toEqual( 'Error notice' );
		} );

		it( "should retrieve no error notice for a block that doesn't have one", () => {
			const errorNotices = getErrorNoticeForBlock(
				state,
				'block/no-error'
			);
			expect( errorNotices ).toEqual( false );
		} );
	} );
} );
