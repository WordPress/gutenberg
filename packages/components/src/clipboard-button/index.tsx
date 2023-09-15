/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Button from '../button';
import type { ClipboardButtonProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

const TIMEOUT = 4000;

export default function ClipboardButton( {
	className,
	children,
	onCopy,
	onFinishCopy,
	text,
	...buttonProps
}: WordPressComponentProps< ClipboardButtonProps, 'button', false > ) {
	deprecated( 'wp.components.ClipboardButton', {
		since: '5.8',
		alternative: 'wp.compose.useCopyToClipboard',
	} );

	const timeoutId = useRef< NodeJS.Timeout >();
	const ref = useCopyToClipboard( text, () => {
		onCopy();
		if ( timeoutId.current ) {
			clearTimeout( timeoutId.current );
		}

		if ( onFinishCopy ) {
			timeoutId.current = setTimeout( () => onFinishCopy(), TIMEOUT );
		}
	} );

	useEffect( () => {
		if ( timeoutId.current ) {
			clearTimeout( timeoutId.current );
		}
	}, [] );

	const classes = classnames( 'components-clipboard-button', className );

	// Workaround for inconsistent behavior in Safari, where <textarea> is not
	// the document.activeElement at the moment when the copy event fires.
	// This causes documentHasSelection() in the copy-handler component to
	// mistakenly override the ClipboardButton, and copy a serialized string
	// of the current block instead.
	const focusOnCopyEventTarget: React.ClipboardEventHandler = ( event ) => {
		// @ts-expect-error: Should be currentTarget, but not changing because this component is deprecated.
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
