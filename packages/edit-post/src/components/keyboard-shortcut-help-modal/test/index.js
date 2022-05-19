/**
 * External dependencies
 */
import { noop } from 'lodash';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { KeyboardShortcutHelpModal } from '../index';

describe( 'KeyboardShortcutHelpModal', () => {
	it( 'should match snapshot when the modal is active', () => {
		const wrapper = shallow(
			<KeyboardShortcutHelpModal
				isModalActive={ true }
				toggleModal={ noop }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should match snapshot when the modal is not active', () => {
		const wrapper = shallow(
			<KeyboardShortcutHelpModal
				isModalActive={ false }
				toggleModal={ noop }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
