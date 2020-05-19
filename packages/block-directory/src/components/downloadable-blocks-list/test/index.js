/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import DownloadableBlocksList from '../index';
import DownloadableBlockListItem from '../../downloadable-block-list-item';
import { items, plugin } from './fixtures';

const getContainer = ( {
	blocks,
	selectMock = jest.fn(),
	hoverMock = jest.fn(),
	isLoading = false,
	errorNotices = {},
	install = jest.fn(),
} ) => {
	return shallow(
		<DownloadableBlocksList
			items={ blocks }
			onSelect={ selectMock }
			onHover={ hoverMock }
			errorNotices={ errorNotices }
			isLoading={ isLoading }
			install={ install }
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

			expect( wrapper.find( DownloadableBlockListItem ).length ).toBe(
				items.length
			);
		} );
	} );
	describe( 'Behaviour', () => {
		it( 'should try to install the block plugin', () => {
			const install = jest.fn();
			const errorNotices = {};

			const wrapper = getContainer( {
				blocks: [ plugin ],
				install,
				errorNotices,
			} );
			const listItems = wrapper.find( DownloadableBlockListItem );

			listItems.get( 0 ).props.onClick();

			expect( install ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
