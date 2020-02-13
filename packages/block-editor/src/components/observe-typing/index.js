/**
 * External dependencies
 */
import { over, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { isTextField } from '@wordpress/dom';
import {
	UP,
	RIGHT,
	DOWN,
	LEFT,
	ENTER,
	BACKSPACE,
	ESCAPE,
} from '@wordpress/keycodes';
import { withSafeTimeout } from '@wordpress/compose';

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

function ObserveTyping( { children, setTimeout: setSafeTimeout } ) {
	const lastMouseMove = useRef();
	const isTyping = useSelect( ( select ) =>
		select( 'core/block-editor' ).isTyping()
	);
	const { startTyping, stopTyping } = useDispatch( 'core/block-editor' );
	useEffect( () => {
		toggleEventBindings( isTyping );
		return () => toggleEventBindings( false );
	}, [ isTyping ] );

	/**
	 * Bind or unbind events to the document when typing has started or stopped
	 * respectively, or when component has become unmounted.
	 *
	 * @param {boolean} isBound Whether event bindings should be applied.
	 */
	function toggleEventBindings( isBound ) {
		const bindFn = isBound ? 'addEventListener' : 'removeEventListener';
		document[ bindFn ](
			'selectionchange',
			stopTypingOnSelectionUncollapse
		);
		document[ bindFn ]( 'mousemove', stopTypingOnMouseMove );
	}

	/**
	 * On mouse move, unset typing flag if user has moved cursor.
	 *
	 * @param {MouseEvent} event Mousemove event.
	 */
	function stopTypingOnMouseMove( event ) {
		const { clientX, clientY } = event;

		// We need to check that the mouse really moved because Safari triggers
		// mousemove events when shift or ctrl are pressed.
		if ( lastMouseMove.current ) {
			const {
				clientX: lastClientX,
				clientY: lastClientY,
			} = lastMouseMove.current;

			if ( lastClientX !== clientX || lastClientY !== clientY ) {
				stopTyping();
			}
		}

		lastMouseMove.current = { clientX, clientY };
	}

	/**
	 * On selection change, unset typing flag if user has made an uncollapsed
	 * (shift) selection.
	 */
	function stopTypingOnSelectionUncollapse() {
		const selection = window.getSelection();
		const isCollapsed =
			selection.rangeCount > 0 && selection.getRangeAt( 0 ).collapsed;

		if ( ! isCollapsed ) {
			stopTyping();
		}
	}

	/**
	 * Unsets typing flag if user presses Escape while typing flag is active.
	 *
	 * @param {KeyboardEvent} event Keypress or keydown event to interpret.
	 */
	function stopTypingOnEscapeKey( event ) {
		if ( isTyping && event.keyCode === ESCAPE ) {
			stopTyping();
		}
	}

	/**
	 * Handles a keypress or keydown event to infer intention to start typing.
	 *
	 * @param {KeyboardEvent} event Keypress or keydown event to interpret.
	 */
	function startTypingInTextField( event ) {
		const { type, target } = event;

		// Abort early if already typing, or key press is incurred outside a
		// text field (e.g. arrow-ing through toolbar buttons).
		// Ignore typing in a block toolbar
		if (
			isTyping ||
			! isTextField( target ) ||
			target.closest( '.block-editor-block-toolbar' )
		) {
			return;
		}

		// Special-case keydown because certain keys do not emit a keypress
		// event. Conversely avoid keydown as the canonical event since there
		// are many keydown which are explicitly not targeted for typing.
		if (
			type === 'keydown' &&
			! isKeyDownEligibleForStartTyping( event )
		) {
			return;
		}

		startTyping();
	}

	/**
	 * Stops typing when focus transitions to a non-text field element.
	 *
	 * @param {FocusEvent} event Focus event.
	 */
	function stopTypingOnNonTextField( event ) {
		const { target } = event;

		// Since focus to a non-text field via arrow key will trigger before
		// the keydown event, wait until after current stack before evaluating
		// whether typing is to be stopped. Otherwise, typing will re-start.
		setSafeTimeout( () => {
			if ( isTyping && ! isTextField( target ) ) {
				stopTyping();
			}
		} );
	}

	// Disable reason: This component is responsible for capturing bubbled
	// keyboard events which are interpreted as typing intent.

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div
			onFocus={ stopTypingOnNonTextField }
			onKeyPress={ startTypingInTextField }
			onKeyDown={ over( [
				startTypingInTextField,
				stopTypingOnEscapeKey,
			] ) }
		>
			{ children }
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/observe-typing/README.md
 */
export default withSafeTimeout( ObserveTyping );
