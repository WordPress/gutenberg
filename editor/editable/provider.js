/**
 * External dependencies
 */
import { pick, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * The Editable Provider allows a rendering context to define global behaviors
 * without requiring intermediate props to be passed through to the Editable.
 * The provider accepts as props its `childContextTypes` which are passed to
 * any Editable instance.
 */
class EditableProvider extends Component {
	getChildContext() {
		return pick(
			this.props,
			Object.keys( this.constructor.childContextTypes )
		);
	}

	render() {
		return this.props.children;
	}
}

EditableProvider.childContextTypes = {
	onUndo: noop,
};

export default EditableProvider;
