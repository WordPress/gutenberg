/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createElement } from '@wordpress/element';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { toElement, applySelection } from '@wordpress/rich-text';

/**
 * Browser dependencies
 */

const { userAgent } = window.navigator;

/**
 * Applies a fix that provides `input` events for contenteditable in Internet Explorer.
 *
 * @param {Element} editorNode The root editor node.
 *
 * @return {Function} A function to remove the fix (for cleanup).
 */
function applyInternetExplorerInputFix( editorNode ) {
	/**
	 * Dispatches `input` events in response to `textinput` events.
	 *
	 * IE provides a `textinput` event that is similar to an `input` event,
	 * and we use it to manually dispatch an `input` event.
	 * `textinput` is dispatched for text entry but for not deletions.
	 *
	 * @param {Event} textInputEvent An Internet Explorer `textinput` event.
	 */
	function mapTextInputEvent( textInputEvent ) {
		textInputEvent.stopImmediatePropagation();

		const inputEvent = document.createEvent( 'Event' );
		inputEvent.initEvent( 'input', true, false );
		inputEvent.data = textInputEvent.data;
		textInputEvent.target.dispatchEvent( inputEvent );
	}

	/**
	 * Dispatches `input` events in response to Delete and Backspace keyup.
	 *
	 * It would be better dispatch an `input` event after each deleting
	 * `keydown` because the DOM is updated after each, but it is challenging
	 * to determine the right time to dispatch `input` since propagation of
	 * `keydown` can be stopped at any point.
	 *
	 * It's easier to listen for `keyup` in the capture phase and dispatch
	 * `input` before `keyup` propagates further. It's not perfect, but should
	 * be good enough.
	 *
	 * @param {KeyboardEvent} keyUp
	 * @param {Node}          keyUp.target  The event target.
	 * @param {number}        keyUp.keyCode The key code.
	 */
	function mapDeletionKeyUpEvents( { target, keyCode } ) {
		const isDeletion = BACKSPACE === keyCode || DELETE === keyCode;

		if ( isDeletion && editorNode.contains( target ) ) {
			const inputEvent = document.createEvent( 'Event' );
			inputEvent.initEvent( 'input', true, false );
			inputEvent.data = null;
			target.dispatchEvent( inputEvent );
		}
	}

	editorNode.addEventListener( 'textinput', mapTextInputEvent );
	document.addEventListener( 'keyup', mapDeletionKeyUpEvents, true );
	return function removeInternetExplorerInputFix() {
		editorNode.removeEventListener( 'textinput', mapTextInputEvent );
		document.removeEventListener( 'keyup', mapDeletionKeyUpEvents, true );
	};
}

const IS_PLACEHOLDER_VISIBLE_ATTR_NAME = 'data-is-placeholder-visible';
const CLASS_NAME = 'editor-rich-text__editable block-editor-rich-text__editable';

/**
 * Whether or not the user agent is Internet Explorer.
 *
 * @type {boolean}
 */
const IS_IE = userAgent.indexOf( 'Trident' ) >= 0;

export default class Editable extends Component {
	constructor() {
		super();
		this.bindEditorNode = this.bindEditorNode.bind( this );
	}

	bindEditorNode( editorNode ) {
		this.editorNode = editorNode;
		this.props.setRef( editorNode );

		if ( IS_IE ) {
			if ( editorNode ) {
				// Mounting:
				this.removeInternetExplorerInputFix = applyInternetExplorerInputFix( editorNode );
			} else {
				// Unmounting:
				this.removeInternetExplorerInputFix();
			}
		}
	}

	componentDidUpdate() {
		if ( this.selection && this.selection.startPath.length > 0 ) {
			applySelection( this.selection, this.editorNode );
		}
	}

	render() {
		const {
			tagName = 'div',
			style,
			value,
			className,
			isPlaceholderVisible,
			...remainingProps
		} = this.props;

		delete remainingProps.setRef;

		const { element, selection } = toElement( {
			value,
			multilineTag: this.props.multilineTag,
			multilineWrapperTags: this.props.multilineWrapperTags,
		} );

		this.selection = selection;

		return createElement( tagName, {
			role: 'textbox',
			'aria-multiline': true,
			className: classnames( className, CLASS_NAME ),
			contentEditable: true,
			[ IS_PLACEHOLDER_VISIBLE_ATTR_NAME ]: isPlaceholderVisible,
			ref: this.bindEditorNode,
			style,
			suppressContentEditableWarning: true,
			...remainingProps,
		}, element );
	}
}
