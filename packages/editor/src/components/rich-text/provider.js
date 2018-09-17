/**
 * External dependencies
 */
import { pick, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { Component } from '@wordpress/element';

/**
 * The RichText Provider allows a rendering context to define global behaviors
 * without requiring intermediate props to be passed through to the RichText.
 * The provider accepts as props its `childContextTypes` which are passed to
 * any RichText instance.
 */
class RichTextProvider extends Component {
	getChildContext() {
		deprecated( 'wp.editor.RichTextProvider', {
			alternative: "wp.data.select( 'core/editor' ) methods",
			version: '4.0.0',
			plugin: 'Gutenberg',
			hint: 'This is a global warning, shown regardless of whether the component is used.',
		} );

		return pick(
			this.props,
			Object.keys( this.constructor.childContextTypes )
		);
	}

	render() {
		return this.props.children;
	}
}

RichTextProvider.childContextTypes = {
	onUndo: noop,
	onRedo: noop,
	onCreateUndoLevel: noop,
};

export default RichTextProvider;
