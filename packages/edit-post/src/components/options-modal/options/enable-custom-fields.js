/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BaseOption from './base';

class EnableCustomFieldsOption extends Component {
	constructor( { settings: { isEnabled } } ) {
		super( ...arguments );

		this.toggleCustomFields = this.toggleCustomFields.bind( this );

		this.state = { isEnabled };
	}

	toggleCustomFields() {
		const { toggleURL, isEnabled } = this.props.settings;

		// Redirect to an admin action that toggles the setting and reloads the editor
		// with the meta box assets included on the page.
		window.location.href = toggleURL;

		// Make it look like something happened while the page reloads.
		this.setState( { isEnabled: ! isEnabled } );
	}

	render() {
		const { label } = this.props;
		const { isEnabled } = this.state;

		return (
			<BaseOption
				label={ label }
				isChecked={ isEnabled }
				onChange={ this.toggleCustomFields }
			/>
		);
	}
}

export default withSelect( ( select ) => ( {
	settings: select( 'core/editor' ).getEditorSettings().customFields,
} ) )( EnableCustomFieldsOption );
