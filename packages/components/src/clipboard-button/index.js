/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useCopyOnClick } from '@wordpress/compose';

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
	const hasCopied = useCopyOnClick( ref, text );
	const lastHasCopied = useRef( hasCopied );

	useEffect( () => {
		if ( lastHasCopied.current === hasCopied ) {
			return;
		}

		if ( hasCopied && typeof onCopy === 'function' ) {
			onCopy();
		} else if ( typeof onFinishCopy === 'function' ) {
			onFinishCopy();
		}

		lastHasCopied.current = hasCopied;
	}, [ onCopy, onFinishCopy, hasCopied ] );

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
