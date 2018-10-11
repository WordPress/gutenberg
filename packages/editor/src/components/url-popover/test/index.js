/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import URLPopover from '../';

describe( 'URLPopover', () => {
	it( 'matches the snapshot when viewing the url', () => {
		const wrapper = shallow(
			<URLPopover
				onClickOutside={ noop }
				isEditing={ false }
				renderEditingState={ () => (
					<div>Editing</div>
				) }
				renderViewingState={ () => (
					<div>Viewing</div>
				) }
				renderSettings={ () => (
					<div>Settings</div>
				) }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when editing the url', () => {
		const wrapper = shallow(
			<URLPopover
				onClickOutside={ noop }
				isEditing={ true }
				renderEditingState={ () => (
					<div>Editing</div>
				) }
				renderViewingState={ () => (
					<div>Viewing</div>
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
				onClickOutside={ noop }
				isEditing={ true }
				renderEditingState={ () => (
					<div>Editing</div>
				) }
				renderViewingState={ () => (
					<div>Viewing</div>
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
				onClickOutside={ noop }
				isEditing={ true }
				renderEditingState={ () => (
					<div>Editing</div>
				) }
				renderViewingState={ () => (
					<div>Viewing</div>
				) }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );
} );
