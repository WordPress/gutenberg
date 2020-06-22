/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import DownloadableBlockListItem from '../index';
import DownloadableBlockHeader from '../../downloadable-block-header';
import { item } from './fixtures';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

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
