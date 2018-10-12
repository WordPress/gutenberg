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
				renderURLEditor={ () => (
					<div>Editor</div>
				) }
				renderSettings={ () => (
					<div>Settings</div>
				) }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when the settings are toggled open', () => {
		const wrapper = shallow(
			<URLPopover
				renderURLEditor={ () => (
					<div>Editor</div>
				) }
				renderSettings={ () => (
					<div>Settings</div>
				) }
			/>
		);

		const toggleButton = wrapper.find( '.editor-url-popover__settings-toggle' );
		expect( toggleButton ).toHaveLength( 1 );
		toggleButton.simulate( 'click' );

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when there are no settings', () => {
		const wrapper = shallow(
			<URLPopover
				renderURLEditor={ () => (
					<div>Editor</div>
				) }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
