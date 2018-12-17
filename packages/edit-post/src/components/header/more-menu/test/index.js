/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import MoreMenu from '../index';

jest.mock( '../../../../../../components/src/button' );

describe( 'MoreMenu', () => {
	it( 'should match snapshot', () => {
		const wrapper = mount(
			<MoreMenu />
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
