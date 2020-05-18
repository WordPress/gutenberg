/**
 * External dependencies
 */
import Clipboard from 'clipboard';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';

export default function ClipboardButton( {
	className,
	children,
	onCopy,
	onFinishCopy,
	text,
	...buttonProps
} ) {
	const ref = useRef();
	const clipboard = useRef();

	useEffect( () => {
		let timeoutId;

		clipboard.current = new Clipboard( ref.current, {
			text: () => ( typeof text === 'function' ? text() : text ),
			container: ref.current,
		} );

		clipboard.current.on( 'success', ( { clearSelection } ) => {
			// Clearing selection will move focus back to the triggering button,
			// ensuring that it is not reset to the body, and further that it is
			// kept within the rendered node.
			clearSelection();

			if ( onCopy ) {
				onCopy();

				// For convenience and consistency, ClipboardButton offers to
				// call a secondary callback with delay. This is useful to reset
				// consumers' state, e.g. to revert a label from "Copied" to
				// "Copy".
				if ( onFinishCopy ) {
					clearTimeout( timeoutId );
					timeoutId = setTimeout( onFinishCopy, 4000 );
				}
			}
		} );

		return () => {
			clipboard.current.destroy();
			clearTimeout( timeoutId );
		};
	}, [ onCopy, onFinishCopy, text ] );

	const classes = classnames( 'components-clipboard-button', className );

	// Workaround for inconsistent behavior in Safari, where <textarea> is not
	// the document.activeElement at the moment when the copy event fires.
	// This causes documentHasSelection() in the copy-handler component to
	// mistakenly override the ClipboardButton, and copy a serialized string
	// of the current block instead.
	const focusOnCopyEventTarget = ( event ) => {
		event.target.focus();
	};

	return (
		<Button
			{ ...buttonProps }
			className={ classes }
			ref={ ref }
			onCopy={ focusOnCopyEventTarget }
		>
			{ children }
		</Button>
	);
}
