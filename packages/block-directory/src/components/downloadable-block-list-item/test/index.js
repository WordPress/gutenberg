/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../index';
import DownloadableBlockHeader from '../../downloadable-block-header';
import DownloadableBlockInfo from '../../downloadable-block-info';
import DownloadableBlockAuthorInfo from '../../downloadable-block-author-info';
import { plugin } from './fixtures';

const getContainer = ( item, onClick = jest.fn(), isLoading = false ) => {
	return shallow(
		<DownloadableBlockListItem
			key={ item.id }
			item={ item }
			onClick={ onClick }
			onFocus={ jest.fn() }
			onMouseEnter={ jest.fn() }
			onMouseLeave={ jest.fn() }
			onBlur={ jest.fn() }
			isLoading={ isLoading }
		/>
	);
};

describe( 'DownloadableBlockListItem', () => {
	describe( 'Rendering', () => {
		it( 'Should render the base components', () => {
			const wrapper = getContainer( plugin, false );
			expect( wrapper.find( DownloadableBlockHeader ).length ).toBe( 1 );
			expect( wrapper.find( DownloadableBlockInfo ).length ).toBe( 1 );
			expect( wrapper.find( DownloadableBlockAuthorInfo ).length ).toBe( 1 );
		} );
	} );
} );
