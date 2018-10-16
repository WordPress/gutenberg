/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { OptionsModal } from '../';

describe( 'OptionsModal', () => {
	it( 'should match snapshot when the modal is active', () => {
		const wrapper = shallow( <OptionsModal isModalActive={ true } /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should not render when the modal is not active', () => {
		const wrapper = shallow( <OptionsModal isModalActive={ false } /> );
		expect( wrapper.isEmptyRender() ).toBe( true );
	} );
} );
