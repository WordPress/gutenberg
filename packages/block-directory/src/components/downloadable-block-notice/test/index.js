/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import DownloadableBlockNotice from '../index';
import { plugin } from './fixtures';

import { INSTALL_ERROR_NOTICE_ID } from '../../../store/constants';

const getContainer = ( { block, onClick = jest.fn(), errorNotices = {} } ) => {
	return shallow(
		<DownloadableBlockNotice
			block={ block }
			onClick={ onClick }
			errorNotices={ errorNotices }
		/>
	);
};

describe( 'DownloadableBlockNotice', () => {
	describe( 'Rendering', () => {
		it( 'should return null when there are no error notices', () => {
			const wrapper = getContainer( { block: plugin } );
			expect( wrapper.isEmptyRender() ).toBe( true );
		} );

		it( 'should return something when there are error notices', () => {
			const errorNotices = {
				[ plugin.id ]: INSTALL_ERROR_NOTICE_ID,
			};
			const wrapper = getContainer( { block: plugin, errorNotices } );
			expect( wrapper.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Behavior', () => {
		it( 'should trigger the callback on button click', () => {
			const errorNotices = {
				[ plugin.id ]: INSTALL_ERROR_NOTICE_ID,
			};

			const onClick = jest.fn();
			const wrapper = getContainer( {
				block: plugin,
				onClick,
				errorNotices,
			} );

			wrapper.find( Button ).simulate( 'click', { event: {} } );

			expect( onClick ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
