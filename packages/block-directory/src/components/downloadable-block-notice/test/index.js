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

import { DOWNLOAD_ERROR_NOTICE_ID, INSTALL_ERROR_NOTICE_ID } from '../../../store/constants';

const getContainer = ( { block, fullInstall = jest.fn(), download = jest.fn(), errorNotices = {} } ) => {
	return shallow(
		<DownloadableBlockNotice
			block={ block }
			fullInstall={ fullInstall }
			download={ download }
			errorNotices={ errorNotices }
		/>
	);
};

describe( 'DownloadableBlockNotice', () => {
	describe( 'Rendering', () => {
		it( 'should return null when there are no error notices', () => {
			const wrapper = getContainer( { block: plugin } );
			expect( wrapper.type() ).toEqual( null );
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
		it( 'should try the full install when the install failed', () => {
			const errorNotices = {
				[ plugin.id ]: INSTALL_ERROR_NOTICE_ID,
			};

			const fullInstall = jest.fn();
			const download = jest.fn();

			const wrapper = getContainer( { block: plugin, fullInstall, download, errorNotices } );

			wrapper.find( Button ).simulate( 'click', { event: {} } );

			expect( fullInstall.mock.calls.length ).toBe( 1 );
			expect( download.mock.calls.length ).toBe( 0 );
		} );

		it( 'should try to download again if it installed but failed to download', () => {
			const errorNotices = {
				[ plugin.id ]: DOWNLOAD_ERROR_NOTICE_ID,
			};

			const fullInstall = jest.fn();
			const download = jest.fn();

			const wrapper = getContainer( { block: plugin, fullInstall, download, errorNotices } );

			wrapper.find( Button ).simulate( 'click', { event: {} } );

			expect( fullInstall.mock.calls.length ).toBe( 0 );
			expect( download.mock.calls.length ).toBe( 1 );
		} );
	} );
} );
