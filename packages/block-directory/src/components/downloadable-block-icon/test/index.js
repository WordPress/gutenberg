/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import DownloadableBlockIcon from '../index';

const IMAGE_URL = 'https://ps.w.org/listicles/assets/icon-128x128.png';

describe( 'Downloadable Block Icon', () => {
	describe( 'icon rendering', () => {
		test( 'should render an <img> tag', () => {
			const wrapper = shallow(
				<DownloadableBlockIcon icon={ IMAGE_URL } title="Block Name" />
			);
			expect( wrapper ).toMatchSnapshot();
		} );

		test( 'should render an <img> tag if icon URL has query string', () => {
			const wrapper = shallow(
				<DownloadableBlockIcon
					icon={ IMAGE_URL + '?rev=2011672&test=234234' }
					title="Block Name"
				/>
			);

			expect( wrapper ).toMatchSnapshot();
		} );

		test( 'should render a <BlockIcon /> component', () => {
			const wrapper = shallow(
				<DownloadableBlockIcon icon="default" title="Block Name" />
			);

			expect( wrapper ).toMatchSnapshot();
		} );
	} );
} );
