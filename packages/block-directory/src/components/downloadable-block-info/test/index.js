/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import DownloadableBlockInfo from '../index';

describe( 'DownloadableBlockInfo', () => {
	const metaSelector = '.block-directory-downloadable-block-info__meta';
	describe( 'Active Installs Count', () => {
		it( 'should display the correct count for over a million installs', () => {
			const wrapper = shallow(
				<DownloadableBlockInfo activeInstalls={ 10000000 } />
			);

			const count = wrapper.find( metaSelector ).first().text();

			expect( count ).toContain( '10+ Million' );
		} );

		it( 'should display the correct count for 0 installs', () => {
			const wrapper = shallow(
				<DownloadableBlockInfo activeInstalls={ 0 } />
			);

			const count = wrapper.find( metaSelector ).first().text();

			expect( count ).toContain( 'Less than 10 active installations' );
		} );

		it( 'should display the correct count for 10+ and less than a Million installs', () => {
			const wrapper = shallow(
				<DownloadableBlockInfo activeInstalls={ 100 } />
			);

			const count = wrapper.find( metaSelector ).first().text();

			expect( count ).toContain( '100+ active installations' );
		} );
	} );
} );
