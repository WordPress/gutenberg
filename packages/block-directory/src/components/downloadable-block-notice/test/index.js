/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { DownloadableBlockNotice } from '../index';
import { plugin } from './fixtures';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

describe( 'DownloadableBlockNotice', () => {
	describe( 'Rendering', () => {
		it( 'should return null when there are no error notices', () => {
			useSelect.mockImplementation( () => false );
			const wrapper = shallow(
				<DownloadableBlockNotice
					block={ plugin }
					onClick={ jest.fn() }
				/>
			);
			expect( wrapper.isEmptyRender() ).toBe( true );
		} );

		it( 'should return something when there are error notices', () => {
			useSelect.mockImplementation( () => 'Plugin not found.' );
			const wrapper = shallow(
				<DownloadableBlockNotice
					block={ plugin }
					onClick={ jest.fn() }
				/>
			);
			expect( wrapper ).toMatchSnapshot();
		} );
	} );

	describe( 'Behavior', () => {
		it( 'should trigger the callback on button click', () => {
			useSelect.mockImplementation( () => 'Plugin not found.' );
			const onClick = jest.fn();
			const wrapper = shallow(
				<DownloadableBlockNotice block={ plugin } onClick={ onClick } />
			);

			wrapper.find( Button ).simulate( 'click', { event: {} } );

			expect( onClick ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
