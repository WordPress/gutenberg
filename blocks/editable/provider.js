/**
 * External dependencies
 */
import { EventEmitter } from 'events/';
import { pick, noop, isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

/**
 * The Editable Provider allows a rendering context to define global behaviors
 * without requiring intermediate props to be passed through to the Editable.
 * The provider accepts as props its `childContextTypes` which are passed to
 * any Editable instance.
 */
class EditableProvider extends Component {
	componentWillMount() {
		this.focusEmitter = new EventEmitter();
	}

	getChildContext() {
		const { focusEmitter } = this;

		return {
			focusEmitter,
			...pick(
				this.props,
				Object.keys( this.constructor.childContextTypes )
			),
		};
	}

	componentWillReceiveProps( nextProps ) {
		if ( ! isEqual( nextProps.focus, this.props.focus ) ) {
			this.focusEmitter.emit( 'change' );
		}
	}

	render() {
		return this.props.children;
	}
}

EditableProvider.childContextTypes = {
	onUndo: noop,
	focus: noop,
	onFocus: noop,
	focusEmitter: noop,
};

export default EditableProvider;
