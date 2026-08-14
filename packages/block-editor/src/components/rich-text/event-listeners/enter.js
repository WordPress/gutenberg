import { ENTER } from '@wordpress/keycodes';
import {
	insert,
	remove,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { privateApis as composePrivateApis } from '@wordpress/compose';
import { unlock } from '../../../lock-unlock';

const { subscribeOwnedListener, ownsSelection } = unlock( richTextPrivateApis );
const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	function onKeyDown( event ) {
		if ( event.keyCode !== ENTER ) {
			return;
		}

		const {
			onReplace,
			onSplit,
			supportsSplitting,
			disableLineBreaks,
			onChange,
			value,
			onSplitAtDoubleLineEnd,
			registry,
			onSplitAtEnd,
		} = props.current;
		const { text, start, end } = value;

		if ( event.shiftKey ) {
			if ( ! disableLineBreaks ) {
				event.preventDefault();
				onChange( insert( value, '\n' ) );
			}
		} else if ( onSplitAtEnd && start === end && end === text.length ) {
			event.preventDefault();
			onSplitAtEnd();
		} else if ( onReplace && onSplit ) {
			event.__deprecatedOnSplit = true;
		} else if (
			! supportsSplitting &&
			! disableLineBreaks &&
			! event.defaultPrevented
		) {
			event.preventDefault();
			if (
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
			} else {
				onChange( insert( value, '\n' ) );
			}
		}
	}

	function onDefaultKeyDown( event ) {
		if ( event.defaultPrevented ) {
			return;
		}

		// The event listener is attached to the window, so we need to check if
		// the target is the element, or whether the element owns the
		// selection through a focused editing host.
		if ( event.target !== element && ! ownsSelection( element ) ) {
			return;
		}

		if ( event.keyCode !== ENTER ) {
			return;
		}

		// On ENTER, we ALWAYS want to prevent the default browser behaviour
		// at this last interception point.
		event.preventDefault();
	}

	const { defaultView } = element.ownerDocument;

	// Attach the listener to the window so parent elements have the chance to
	// prevent the default behavior.
	const unsubscribeDefaultKeyDown = subscribeDelegatedListener(
		defaultView,
		'keydown',
		onDefaultKeyDown
	);
	// Capture phase so this runs before ancestor (writing flow) bubble
	// handlers, matching the timing of the previous raw element listener.
	const unsubscribeKeyDown = subscribeOwnedListener(
		element,
		'keydown',
		onKeyDown,
		true
	);
	return () => {
		unsubscribeDefaultKeyDown();
		unsubscribeKeyDown();
	};
};
