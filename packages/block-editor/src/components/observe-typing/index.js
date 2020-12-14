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
	TAB,
} from '@wordpress/keycodes';

/**
 * Set of key codes upon which typing is to be initiated on a keydown event.
 *
 * @type {Set<number>}
 */
const KEY_DOWN_ELIGIBLE_KEY_CODES = new Set( [
	UP,
	RIGHT,
	DOWN,
	LEFT,
	ENTER,
	BACKSPACE,
] );

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
	return ! shiftKey && KEY_DOWN_ELIGIBLE_KEY_CODES.has( keyCode );
}

export function useTypingObserver( ref ) {
	const isTyping = useSelect( ( select ) =>
		select( 'core/block-editor' ).isTyping()
	);
	const { startTyping, stopTyping } = useDispatch( 'core/block-editor' );

	useEffect( () => {
		const element = ref.current;
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;

		// Listeners to stop typing should only be added when typing.
		// Listeners to start typing should only be added when not typing.
		if ( isTyping ) {
			let timerId;

			/**
			 * Stops typing when focus transitions to a non-text field element.
			 *
			 * @param {FocusEvent} event Focus event.
			 */
			function stopTypingOnNonTextField( event ) {
				const { target } = event;

				// Since focus to a non-text field via arrow key will trigger
				// before the keydown event, wait until after current stack
				// before evaluating whether typing is to be stopped. Otherwise,
				// typing will re-start.
				timerId = defaultView.setTimeout( () => {
					if ( ! isTextField( target ) ) {
						stopTyping();
					}
				} );
			}

			/**
			 * Unsets typing flag if user presses Escape while typing flag is
			 * active.
			 *
			 * @param {KeyboardEvent} event Keypress or keydown event to
			 *                              interpret.
			 */
			function stopTypingOnEscapeKey( event ) {
				const { keyCode } = event;

				if ( keyCode === ESCAPE || keyCode === TAB ) {
					stopTyping();
				}
			}

			/**
			 * On selection change, unset typing flag if user has made an
			 * uncollapsed (shift) selection.
			 */
			function stopTypingOnSelectionUncollapse() {
				const selection = defaultView.getSelection();
				const isCollapsed =
					selection.rangeCount > 0 &&
					selection.getRangeAt( 0 ).collapsed;

				if ( ! isCollapsed ) {
					stopTyping();
				}
			}

			let lastClientX;
			let lastClientY;

			/**
			 * On mouse move, unset typing flag if user has moved cursor.
			 *
			 * @param {MouseEvent} event Mousemove event.
			 */
			function stopTypingOnMouseMove( event ) {
				const { clientX, clientY } = event;

				// We need to check that the mouse really moved because Safari
				// triggers mousemove events when shift or ctrl are pressed.
				if (
					lastClientX &&
					lastClientY &&
					( lastClientX !== clientX || lastClientY !== clientY )
				) {
					stopTyping();
				}

				lastClientX = clientX;
				lastClientY = clientY;
			}

			element.addEventListener( 'focus', stopTypingOnNonTextField );
			element.addEventListener( 'keydown', stopTypingOnEscapeKey );
			ownerDocument.addEventListener(
				'selectionchange',
				stopTypingOnSelectionUncollapse
			);
			ownerDocument.addEventListener(
				'mousemove',
				stopTypingOnMouseMove
			);

			return () => {
				defaultView.clearTimeout( timerId );
				element.removeEventListener(
					'focus',
					stopTypingOnNonTextField
				);
				element.removeEventListener( 'keydown', stopTypingOnEscapeKey );
				ownerDocument.removeEventListener(
					'selectionchange',
					stopTypingOnSelectionUncollapse
				);
				ownerDocument.removeEventListener(
					'mousemove',
					stopTypingOnMouseMove
				);
			};
		}

		/**
		 * Handles a keypress or keydown event to infer intention to start
		 * typing.
		 *
		 * @param {KeyboardEvent} event Keypress or keydown event to interpret.
		 */
		function startTypingInTextField( event ) {
			const { type, target } = event;

			// Abort early if already typing, or key press is incurred outside a
			// text field (e.g. arrow-ing through toolbar buttons).
			// Ignore typing if outside the current DOM container
			if ( ! isTextField( target ) || ! element.contains( target ) ) {
				return;
			}

			// Special-case keydown because certain keys do not emit a keypress
			// event. Conversely avoid keydown as the canonical event since
			// there are many keydown which are explicitly not targeted for
			// typing.
			if (
				type === 'keydown' &&
				! isKeyDownEligibleForStartTyping( event )
			) {
				return;
			}

			startTyping();
		}

		element.addEventListener( 'keypress', startTypingInTextField );
		element.addEventListener( 'keydown', startTypingInTextField );

		return () => {
			element.removeEventListener( 'keypress', startTypingInTextField );
			element.removeEventListener( 'keydown', startTypingInTextField );
		};
	}, [ isTyping, startTyping, stopTyping ] );
}

function ObserveTyping( { children } ) {
	const ref = useRef();
	useTypingObserver( ref );
	return <div ref={ ref }>{ children }</div>;
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/observe-typing/README.md
 */
export default ObserveTyping;
