/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { isTextField, keycodes } from '@wordpress/utils';

const { UP, RIGHT, DOWN, LEFT, ENTER, BACKSPACE } = keycodes;

/**
 * Set of key codes upon which typing is to be initiated on a keydown event.
 *
 * @type {number[]}
 */
const KEY_DOWN_ELIGIBLE_KEY_CODES = [ UP, RIGHT, DOWN, LEFT, ENTER, BACKSPACE ];

/**
 * Returns true if a given keydown event can be inferred as intent to start
 * typing, or false otherwise. A keydown is considered eligible if it is a
 * text navigation without shift active.
 *
 * @param {KeyboardEvent} event Keydown event to test.
 *
 * @return {boolean} Whether event is eligible to start typing.
 */
function isKeyDownEligibleForStartTyping( event ) {
	const { keyCode, shiftKey } = event;
	return ! shiftKey && includes( KEY_DOWN_ELIGIBLE_KEY_CODES, keyCode );
}

class ObserveTyping extends Component {
	constructor() {
		super( ...arguments );

		this.stopTypingOnSelectionUncollapse = this.stopTypingOnSelectionUncollapse.bind( this );
		this.stopTypingOnMouseMove = this.stopTypingOnMouseMove.bind( this );
		this.startTypingInTextField = this.startTypingInTextField.bind( this );

		this.lastMouseMove = null;
	}

	componentDidMount() {
		this.toggleEventBindings( this.props.isTyping );
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.isTyping !== prevProps.isTyping ) {
			this.toggleEventBindings( this.props.isTyping );
		}
	}

	componentWillUnmount() {
		this.toggleEventBindings( false );
	}

	/**
	 * Bind or unbind events to the document when typing has started or stopped
	 * respectively, or when component has become unmounted.
	 *
	 * @param {boolean} isBound Whether event bindings should be applied.
	 */
	toggleEventBindings( isBound ) {
		const bindFn = isBound ? 'addEventListener' : 'removeEventListener';
		document[ bindFn ]( 'selectionchange', this.stopTypingOnSelectionUncollapse );
		document[ bindFn ]( 'mousemove', this.stopTypingOnMouseMove );
	}

	/**
	 * On mouse move, unset typing flag if user has moved cursor.
	 *
	 * @param {MouseEvent} event Mousemove event.
	 */
	stopTypingOnMouseMove( event ) {
		const { clientX, clientY } = event;

		// We need to check that the mouse really moved because Safari triggers
		// mousemove events when shift or ctrl are pressed.
		if ( this.lastMouseMove ) {
			const {
				clientX: lastClientX,
				clientY: lastClientY,
			} = this.lastMouseMove;

			if ( lastClientX !== clientX || lastClientY !== clientY ) {
				this.props.onStopTyping();
			}
		}

		this.lastMouseMove = { clientX, clientY };
	}

	/**
	 * On selection change, unset typing flag if user has made an uncollapsed
	 * (shift) selection.
	 */
	stopTypingOnSelectionUncollapse() {
		const selection = window.getSelection();
		const isCollapsed = selection.rangeCount > 0 && selection.getRangeAt( 0 ).collapsed;

		if ( ! isCollapsed ) {
			this.props.onStopTyping();
		}
	}

	/**
	 * Handles a keypress or keydown event to infer intention to start typing.
	 *
	 * @param {KeyboardEvent} event Keypress or keydown event to interpret.
	 */
	startTypingInTextField( event ) {
		const { isTyping, onStartTyping } = this.props;
		const { type, target } = event;

		// Abort early if already typing, or key press is incurred outside a
		// text field (e.g. arrow-ing through toolbar buttons).
		if ( isTyping || ! isTextField( target ) ) {
			return;
		}

		// Special-case keydown because certain keys do not emit a keypress
		// event. Conversely avoid keydown as the canonical event since there
		// are many keydown which are explicitly not targeted for typing.
		if ( type === 'keydown' && ! isKeyDownEligibleForStartTyping( event ) ) {
			return;
		}

		onStartTyping();
	}

	render() {
		const { children } = this.props;

		// Disable reason: This component is responsible for capturing bubbled
		// keyboard events which are interpreted as typing intent.

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				onKeyPress={ this.startTypingInTextField }
				onKeyDown={ this.startTypingInTextField }
			>
				{ children }
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default compose( [
	withSelect( ( select ) => {
		return {
			isTyping: select( 'core/editor' ).isTyping(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			onStartTyping: dispatch( 'core/editor' ).startTyping,
			onStopTyping: dispatch( 'core/editor' ).stopTyping,
		};
	} ),
] )( ObserveTyping );
