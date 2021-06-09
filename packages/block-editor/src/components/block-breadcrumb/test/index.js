/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import BlockBreadcrumb from '../';

describe( 'BlockBreadcrumb', () => {
	test( 'should match snapshot', () => {
		const wrapper = shallow( <BlockBreadcrumb /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	test( 'should match snapshot with root label', () => {
		const wrapper = shallow( <BlockBreadcrumb rootLabelText="Tuhinga" /> );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
