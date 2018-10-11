/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import LinkContainer from '../';

describe( 'LinkContainer', () => {
	it( 'matches the snapshot when previewing the link', () => {
		const wrapper = shallow(
			<LinkContainer
				position="bottom center"
				onClickOutside={ noop }
				isEditing={ false }
				renderEditingState={ () => (
					<div>Editing</div>
				) }
				renderPreviewState={ () => (
					<div>Preview</div>
				) }
				renderSettings={ () => (
					<div>Settings</div>
				) }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'matches the snapshot when editing the link', () => {
		const wrapper = shallow(
			<LinkContainer
				position="bottom center"
				onClickOutside={ noop }
				isEditing={ true }
				renderEditingState={ () => (
					<div>Editing</div>
				) }
				renderPreviewState={ () => (
					<div>Preview</div>
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
			<LinkContainer
				position="bottom center"
				onClickOutside={ noop }
				isEditing={ true }
				renderEditingState={ () => (
					<div>Editing</div>
				) }
				renderPreviewState={ () => (
					<div>Preview</div>
				) }
				renderSettings={ () => (
					<div>Settings</div>
				) }
			/>
		);

		const toggleButton = wrapper.find( '.editor-link-container__settings-toggle' );
		expect( toggleButton ).toHaveLength( 1 );
		toggleButton.simulate( 'click' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
