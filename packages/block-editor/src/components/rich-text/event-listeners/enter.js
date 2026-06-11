/**
 * WordPress dependencies
 */
import { ENTER } from '@wordpress/keycodes';
import { insert, remove } from '@wordpress/rich-text';
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	function onKeyDownDeprecated( event ) {
		if ( event.keyCode !== ENTER ) {
			return;
		}

		const { onReplace, onSplit } = props.current;

		if ( onReplace && onSplit ) {
			event.__deprecatedOnSplit = true;
		}
	}

	function onKeyDown( event ) {
		if ( event.defaultPrevented ) {
			return;
		}

		// The event listener is attached to the window, so we need to check if
		// the target is the element.
		if ( event.target !== element ) {
			return;
		}

		if ( event.keyCode !== ENTER ) {
			return;
		}

		const {
			value,
			onChange,
			disableLineBreaks,
			onSplitAtEnd,
			onSplitAtDoubleLineEnd,
			registry,
		} = props.current;

		event.preventDefault();

		const { text, start, end } = value;

		if ( event.shiftKey ) {
			if ( ! disableLineBreaks ) {
				onChange( insert( value, '\n' ) );
			}
		} else if ( onSplitAtEnd && start === end && end === text.length ) {
			onSplitAtEnd();
		} else if (
			// For some blocks it's desirable to split at the end of the
			// block when there are two line breaks at the end of the
			// block, so triple Enter exits the block.
			onSplitAtDoubleLineEnd &&
			start === end &&
			end === text.length &&
			text.slice( -2 ) === '\n\n'
		) {
			registry.batch( () => {
				const _value = { ...value };
				_value.start = _value.end - 2;
				onChange( remove( _value ) );
				onSplitAtDoubleLineEnd();
			} );
		} else if ( ! disableLineBreaks ) {
			onChange( insert( value, '\n' ) );
		}
	}

	const { defaultView } = element.ownerDocument;

	// Attach the listener to the window so parent elements have the chance to
	// prevent the default behavior.
	const unsubscribeKeyDown = subscribeDelegatedListener(
		defaultView,
		'keydown',
		onKeyDown
	);
	// Capture phase so this runs before ancestor (writing flow) bubble
	// handlers, matching the timing of the previous raw element listener.
	const unsubscribeKeyDownDeprecated = subscribeDelegatedListener(
		element,
		'keydown',
		onKeyDownDeprecated,
		true
	);
	return () => {
		unsubscribeKeyDown();
		unsubscribeKeyDownDeprecated();
	};
};
