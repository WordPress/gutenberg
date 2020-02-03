/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DownloadableBlocksList } from '../index';
import DownloadableBlockListItem from '../../downloadable-block-list-item';
import { items, plugin } from './fixtures';

import { DOWNLOAD_ERROR_NOTICE_ID } from '../../../store/constants';

const getContainer = ( {
	blocks,
	selectMock = jest.fn(),
	hoverMock = jest.fn(),
	isLoading = false,
	errorNotices = {},
	installAndDownload = jest.fn(),
	download = jest.fn(),
} ) => {
	return shallow(
		<DownloadableBlocksList
			items={ blocks }
			onSelect={ selectMock }
			onHover={ hoverMock }
			errorNotices={ errorNotices }
			isLoading={ isLoading }
			installAndDownload={ installAndDownload }
			download={ download }
		/>
	);
};

describe( 'DownloadableBlocksList', () => {
	describe( 'List rendering', () => {
		it( 'should render and empty list', () => {
			const wrapper = getContainer( { blocks: [] } );
			expect( wrapper.isEmptyRender() ).toBe( true );
		} );

		it( 'should render plugins items into the list', () => {
			const wrapper = getContainer( { blocks: items } );

			expect( wrapper.find( DownloadableBlockListItem ).length ).toBe( items.length );
		} );
	} );
	describe( 'Behaviour', () => {
		it( 'should try to install and download the block plugin', () => {
			const installAndDownload = jest.fn();
			const download = jest.fn();
			const errorNotices = {};

			const wrapper = getContainer( { blocks: [ plugin ], installAndDownload, download, errorNotices } );
			const listItems = wrapper.find( DownloadableBlockListItem );

			listItems.get( 0 ).props.onClick();

			expect( installAndDownload ).toHaveBeenCalledTimes( 1 );
			expect( download ).toHaveBeenCalledTimes( 0 );
		} );
		it( 'should try to only download the block plugin to the page', () => {
			const installAndDownload = jest.fn();
			const download = jest.fn();
			const errorNotices = {
				[ plugin.id ]: DOWNLOAD_ERROR_NOTICE_ID,
			};

			const wrapper = getContainer( { blocks: [ plugin ], installAndDownload, download, errorNotices } );
			const listItems = wrapper.find( DownloadableBlockListItem );

			listItems.get( 0 ).props.onClick();

			expect( installAndDownload ).toHaveBeenCalledTimes( 0 );
			expect( download ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
