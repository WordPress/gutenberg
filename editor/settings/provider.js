/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * The Editor Settings Provider allows any compoent to access the editor settings
 */
class EditorSettingsProvider extends Component {
	getChildContext() {
		return {
			editor: this.props.settings,
		};
	}

	render() {
		return this.props.children;
	}
}

EditorSettingsProvider.childContextTypes = {
	editor: noop,
};

export default EditorSettingsProvider;
