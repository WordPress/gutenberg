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
	constructor( { isEnabled } ) {
		super( ...arguments );

		this.toggleCustomFields = this.toggleCustomFields.bind( this );

		this.state = { isEnabled };
	}

	toggleCustomFields() {
		// Submit a hidden form which triggers the toggle_custom_fields admin action.
		// This action will toggle the setting and reload the editor with the meta box
		// assets included on the page.
		document.getElementById( 'toggle-custom-fields-form' ).submit();

		// Make it look like something happened while the page reloads.
		this.setState( { isEnabled: ! this.props.isEnabled } );
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
	isEnabled: select( 'core/editor' ).getEditorSettings().enableCustomFields,
} ) )( EnableCustomFieldsOption );
