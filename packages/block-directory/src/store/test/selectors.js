/**
 * Internal dependencies
 */
import { downloadableBlock } from './fixtures';
import {
	getDownloadableBlocks,
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
			const errorNotice = getErrorNoticeForBlock(
				state,
				'block/has-error'
			);
			expect( errorNotice ).toEqual( 'Error notice' );
		} );

		it( "should retrieve no error notice for a block that doesn't have one", () => {
			const errorNotice = getErrorNoticeForBlock(
				state,
				'block/no-error'
			);
			expect( errorNotice ).toEqual( false );
		} );
	} );

	describe( 'getDownloadableBlocks', () => {
		const state = {
			downloadableBlocks: {
				isRequestingDownloadableBlocks: false,
				results: {
					boxer: [ downloadableBlock ],
				},
			},
		};

		it( 'should get the list of available blocks for a query', () => {
			const blocks = getDownloadableBlocks( state, 'boxer' );
			expect( blocks ).toHaveLength( 1 );
		} );

		it( 'should get an empty array if no matching query is found', () => {
			const blocks = getDownloadableBlocks( state, 'not-found' );
			expect( blocks ).toEqual( [] );
		} );
	} );
} );
