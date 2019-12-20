/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import URLPopover from '../';

describe( 'URLPopover', () => {
	it( 'matches the snapshot in its default state', () => {
		const wrapper = shallow(
			<URLPopover
				renderSettings={ () => (
					<div>Settings</div>
				) }
			>
				<div>Editor</div>
			</URLPopover>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when the settings are toggled open', () => {
		const wrapper = shallow(
			<URLPopover
				renderSettings={ () => (
					<div>Settings</div>
				) }
			>
				<div>Editor</div>
			</URLPopover>
		);

		const toggleButton = wrapper.find( '.block-editor-url-popover__settings-toggle' );
		expect( toggleButton ).toHaveLength( 1 );
		toggleButton.simulate( 'click' );

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when there are no settings', () => {
		const wrapper = shallow(
			<URLPopover>
				<div>Editor</div>
			</URLPopover>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
