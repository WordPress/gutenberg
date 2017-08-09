/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

const withEditorSettings = ( mapSettingsToProps ) => ( OriginalComponent ) => {
	class WrappedComponent extends Component {
		render() {
			const extraProps = mapSettingsToProps
				? mapSettingsToProps( this.context.editor, this.props )
				: { settings: this.context.editor };

			return (
				<OriginalComponent
					{ ...this.props }
					{ ...extraProps }
				/>
			);
		}
	}

	WrappedComponent.contextTypes = {
		editor: noop,
	};

	return WrappedComponent;
};

export default withEditorSettings;
