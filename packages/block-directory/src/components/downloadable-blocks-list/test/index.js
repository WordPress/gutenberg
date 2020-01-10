/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DownloadableBlocksList } from '../index';
import DownloadableBlockListItem from '../../downloadable-block-list-item';
import { items } from './fixtures';

const getContainer = ( blocks, selectMock, hoverMock, isLoading = false ) => {
	return shallow(
		<DownloadableBlocksList
			items={ blocks }
			onSelect={ selectMock }
			onHover={ hoverMock }
			errorNotices={ {} }
			isLoading={ isLoading }
		/>
	);
};

describe( 'DownloadableBlocksList', () => {
	describe( 'List rendering', () => {
		it( 'should render and empty list', () => {
			const selectMock = jest.fn();
			const hoverMock = jest.fn();
			const wrapper = getContainer( [], selectMock, hoverMock );

			expect( wrapper.find( DownloadableBlockListItem ).length ).toBe( 0 );
		} );

		it( 'should render plugins items into the list', () => {
			const selectMock = jest.fn();
			const hoverMock = jest.fn();
			const wrapper = getContainer( items, selectMock, hoverMock );

			expect( wrapper.find( DownloadableBlockListItem ).length ).toBe( items.length );
		} );
	} );
} );
