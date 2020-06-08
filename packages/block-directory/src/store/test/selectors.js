/**
 * Internal dependencies
 */
import {
	blockList,
	blockTypeInstalled,
	blockTypeUnused,
	downloadableBlock,
} from './fixtures';
import {
	getDownloadableBlocks,
	getErrorNotices,
	getErrorNoticeForBlock,
	getInstalledBlockTypes,
	getNewBlockTypes,
	getUnusedBlockTypes,
	isInstalling,
	isRequestingDownloadableBlocks,
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

	describe( 'isRequestingDownloadableBlocks', () => {
		it( 'should return false if no requests have been made for the block', () => {
			const filterValue = 'Awesome Block';

			const state = {
				downloadableBlocks: {},
			};
			const isRequesting = isRequestingDownloadableBlocks(
				state,
				filterValue
			);

			expect( isRequesting ).toEqual( false );
		} );

		it( 'should return false if there are no pending requests for the block', () => {
			const filterValue = 'Awesome Block';

			const state = {
				downloadableBlocks: {
					[ filterValue ]: {
						isRequesting: false,
					},
				},
			};
			const isRequesting = isRequestingDownloadableBlocks(
				state,
				filterValue
			);

			expect( isRequesting ).toEqual( false );
		} );

		it( 'should return true if the block has a pending request', () => {
			const filterValue = 'Awesome Block';

			const state = {
				downloadableBlocks: {
					[ filterValue ]: {
						isRequesting: true,
					},
					'previous-search-keyword': {
						isRequesting: false,
					},
				},
			};
			const isRequesting = isRequestingDownloadableBlocks(
				state,
				filterValue
			);

			expect( isRequesting ).toEqual( true );
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
				boxer: {
					results: [ downloadableBlock ],
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

	describe( 'isInstalling', () => {
		const BLOCK_1_ID = 'box-block-id';
		const BLOCK_2_ID = 'image-slider-id';

		const state = {
			blockManagement: {
				isInstalling: {
					[ BLOCK_1_ID ]: true,
					[ BLOCK_2_ID ]: false,
				},
			},
		};

		it( 'it should reflect that the block is installing', () => {
			expect( isInstalling( state, BLOCK_1_ID ) ).toBeTruthy();
		} );

		it( 'it should reflect that the block is not installing', () => {
			expect( isInstalling( state, 'not-in-state' ) ).toBeFalsy();
			expect( isInstalling( state, BLOCK_2_ID ) ).toBeFalsy();
		} );
	} );
} );
