/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PreferencesModal } from '../';

describe( 'PreferencesModal', () => {
	it( 'should match snapshot when the modal is active', () => {
		const wrapper = shallow( <PreferencesModal isModalActive={ true } /> );
		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should not render when the modal is not active', () => {
		const wrapper = shallow( <PreferencesModal isModalActive={ false } /> );
		expect( wrapper.isEmptyRender() ).toBe( true );
	} );
} );
