/**
 * External dependencies
 */
import { noop } from 'lodash';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockSettingsMenuContent } from '../content';

describe( 'BlockSettingsMenuContent', () => {
	const handlers = {
		onDelete: noop, onToggleSidebar: noop, onShowInspector: noop, onClose: noop,
	};

	it( 'should not render the HTML mode button on multiselection', () => {
		const wrapper = shallow( <BlockSettingsMenuContent uids={ [ 1, 2 ] } { ...handlers } /> );
		const blockModeToggle = wrapper.find( 'Connect(BlockModeToggle)' );

		expect( blockModeToggle.length ).toBe( 0 );
	} );

	it( 'should render the HTML mode if not in a multiselection', () => {
		const wrapper = shallow(
			<BlockSettingsMenuContent uids={ [ 1 ] } { ...handlers } />
		);
		const blockModeToggle = wrapper.find( 'Connect(BlockModeToggle)' );

		expect( blockModeToggle.length ).toBe( 1 );
	} );
} );
