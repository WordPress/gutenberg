/**
 * External dependencies
 */
import { isEqual } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createElement } from '@wordpress/element';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { diffAriaProps, pickAriaProps } from './aria';

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

	// We must prevent rerenders because the browser will modify the DOM. React
	// will rerender the DOM fine, but we're losing selection and it would be
	// more expensive to do so as it would just set the inner HTML through
	// `dangerouslySetInnerHTML`. Instead RichText does it's own diffing and
	// selection setting.
	//
	// Because we never update the component, we have to look through props and
	// update the attributes on the wrapper nodes here. `componentDidUpdate`
	// will never be called.
	shouldComponentUpdate( nextProps ) {
		this.configureIsPlaceholderVisible( nextProps.isPlaceholderVisible );

		if ( ! isEqual( this.props.style, nextProps.style ) ) {
			this.editorNode.setAttribute( 'style', '' );
			Object.assign( this.editorNode.style, nextProps.style );
		}

		if ( ! isEqual( this.props.className, nextProps.className ) ) {
			this.editorNode.className = classnames( nextProps.className, CLASS_NAME );
		}

		const { removedKeys, updatedKeys } = diffAriaProps( this.props, nextProps );
		removedKeys.forEach( ( key ) =>
			this.editorNode.removeAttribute( key ) );
		updatedKeys.forEach( ( key ) =>
			this.editorNode.setAttribute( key, nextProps[ key ] ) );

		return false;
	}

	configureIsPlaceholderVisible( isPlaceholderVisible ) {
		const isPlaceholderVisibleString = String( !! isPlaceholderVisible );
		if ( this.editorNode.getAttribute( IS_PLACEHOLDER_VISIBLE_ATTR_NAME ) !== isPlaceholderVisibleString ) {
			this.editorNode.setAttribute( IS_PLACEHOLDER_VISIBLE_ATTR_NAME, isPlaceholderVisibleString );
		}
	}

	bindEditorNode( editorNode ) {
		this.editorNode = editorNode;

		if ( this.props.setRef ) {
			this.props.setRef( editorNode );
		}

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

	render() {
		const ariaProps = pickAriaProps( this.props );
		const {
			tagName = 'div',
			style,
			record,
			valueToEditableHTML,
			className,
			isPlaceholderVisible,
			onPaste,
			onInput,
			onKeyDown,
			onCompositionEnd,
			onFocus,
			onBlur,
			onMouseDown,
			onTouchStart,
		} = this.props;

		ariaProps.role = 'textbox';
		ariaProps[ 'aria-multiline' ] = true;

		return createElement( tagName, {
			...ariaProps,
			className: classnames( className, CLASS_NAME ),
			contentEditable: true,
			[ IS_PLACEHOLDER_VISIBLE_ATTR_NAME ]: isPlaceholderVisible,
			ref: this.bindEditorNode,
			style,
			suppressContentEditableWarning: true,
			dangerouslySetInnerHTML: { __html: valueToEditableHTML( record ) },
			onPaste,
			onInput,
			onFocus,
			onBlur,
			onKeyDown,
			onCompositionEnd,
			onMouseDown,
			onTouchStart,
		} );
	}
}
