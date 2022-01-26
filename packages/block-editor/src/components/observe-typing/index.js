/**
 * WordPress dependencies
 */
import { useRefEffect, useMergeRefs } from '@wordpress/compose';
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
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

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
 * If the mouse is inactive for more than this value, the toolbar is hidden.
 *
 * @type {number}
 */
const TOOLBAR_INACTIVITY_TIMEOUT = 5000;

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

/**
 * Removes the `isTyping` flag when the mouse moves in the document of the given
 * element.
 */
export function useMouseMoveTypingReset() {
	const { isTyping } = useSelect( blockEditorStore );
	const { stopTyping, startTyping } = useDispatch( blockEditorStore );

	return useRefEffect( ( node ) => {
		const { ownerDocument } = node;
		let lastClientX;
		let lastClientY;
		let timeoutSinceLastMouseMove;

		/**
		 * On mouse move, unset typing flag if user has moved cursor.
		 *
		 * @param {MouseEvent} event Mousemove event.
		 */
		function stopTypingOnMouseMove( event ) {
			const { clientX, clientY } = event;

			// We need to check that the mouse really moved because Safari
			// triggers mousemove events when shift or ctrl are pressed.
			const didMove =
				lastClientX &&
				lastClientY &&
				( lastClientX !== clientX || lastClientY !== clientY );

			if ( isTyping() && didMove ) {
				stopTyping();
			}

			if ( didMove ) {
				clearTimeout( timeoutSinceLastMouseMove );
				timeoutSinceLastMouseMove = setTimeout( () => {
					// Only hide the toolbar if the active element is inside the container
					// For instance if the focus is on a popover of the toolbar,
					// we shouldn't hide the toolbar.
					if ( node.contains( ownerDocument.activeElement ) ) {
						startTyping();
					}
				}, TOOLBAR_INACTIVITY_TIMEOUT );
			}

			lastClientX = clientX;
			lastClientY = clientY;
		}

		ownerDocument.addEventListener( 'mousemove', stopTypingOnMouseMove );

		return () => {
			ownerDocument.removeEventListener(
				'mousemove',
				stopTypingOnMouseMove
			);
			clearTimeout( timeoutSinceLastMouseMove );
		};
	}, [] );
}

/**
 * Sets and removes the `isTyping` flag based on user actions:
 *
 * - Sets the flag if the user types within the given element.
 * - Removes the flag when the user selects some text, focusses a non-text
 *   field, presses ESC or TAB, or moves the mouse in the document.
 */
export function useTypingObserver() {
	const isTyping = useSelect( ( select ) =>
		select( blockEditorStore ).isTyping()
	);
	const { startTyping, stopTyping } = useDispatch( blockEditorStore );

	const ref1 = useMouseMoveTypingReset();
	const ref2 = useRefEffect(
		( node ) => {
			const { ownerDocument } = node;
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

				node.addEventListener( 'focus', stopTypingOnNonTextField );
				node.addEventListener( 'keydown', stopTypingOnEscapeKey );
				ownerDocument.addEventListener(
					'selectionchange',
					stopTypingOnSelectionUncollapse
				);

				return () => {
					defaultView.clearTimeout( timerId );
					node.removeEventListener(
						'focus',
						stopTypingOnNonTextField
					);
					node.removeEventListener(
						'keydown',
						stopTypingOnEscapeKey
					);
					ownerDocument.removeEventListener(
						'selectionchange',
						stopTypingOnSelectionUncollapse
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
				if ( ! isTextField( target ) || ! node.contains( target ) ) {
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

			node.addEventListener( 'keypress', startTypingInTextField );
			node.addEventListener( 'keydown', startTypingInTextField );

			return () => {
				node.removeEventListener( 'keypress', startTypingInTextField );
				node.removeEventListener( 'keydown', startTypingInTextField );
			};
		},
		[ isTyping, startTyping, stopTyping ]
	);

	return useMergeRefs( [ ref1, ref2 ] );
}

function ObserveTyping( { children } ) {
	return <div ref={ useTypingObserver() }>{ children }</div>;
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/observe-typing/README.md
 */
export default ObserveTyping;
