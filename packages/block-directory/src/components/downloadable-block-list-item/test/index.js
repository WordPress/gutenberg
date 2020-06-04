/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DownloadableBlockListItem } from '../index';
import DownloadableBlockHeader from '../../downloadable-block-header';
import { item } from './fixtures';

describe( 'DownloadableBlockListItem', () => {
	it( 'should render a block item', () => {
		const wrapper = shallow(
			<DownloadableBlockListItem onClick={ jest.fn() } item={ item } />
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should try to install the block plugin', () => {
		const onClick = jest.fn();
		const wrapper = shallow(
			<DownloadableBlockListItem onClick={ onClick } item={ item } />
		);

		wrapper
			.find( DownloadableBlockHeader )
			.simulate( 'click', { event: {} } );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );
} );
