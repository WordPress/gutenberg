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

const TIMEOUT = 4000;

/**
 * @param {Object}                    props
 * @param {string}                    [props.className]
 * @param {import('react').ReactNode} props.children
 * @param {() => void}                props.onCopy
 * @param {() => void}                [props.onFinishCopy]
 * @param {string}                    props.text
 */
export default function ClipboardButton( {
	className,
	children,
	onCopy,
	onFinishCopy,
	text,
	...buttonProps
} ) {
	deprecated( 'wp.components.ClipboardButton', {
		since: '5.8',
		alternative: 'wp.compose.useCopyToClipboard',
	} );

	/** @type {import('react').MutableRefObject<ReturnType<setTimeout> | undefined>} */
	const timeoutId = useRef();
	const ref = useCopyToClipboard( text, () => {
		onCopy();
		// @ts-expect-error: Should check if .current is defined, but not changing because this component is deprecated.
		clearTimeout( timeoutId.current );

		if ( onFinishCopy ) {
			timeoutId.current = setTimeout( () => onFinishCopy(), TIMEOUT );
		}
	} );

	useEffect( () => {
		// @ts-expect-error: Should check if .current is defined, but not changing because this component is deprecated.
		clearTimeout( timeoutId.current );
	}, [] );

	const classes = classnames( 'components-clipboard-button', className );

	// Workaround for inconsistent behavior in Safari, where <textarea> is not
	// the document.activeElement at the moment when the copy event fires.
	// This causes documentHasSelection() in the copy-handler component to
	// mistakenly override the ClipboardButton, and copy a serialized string
	// of the current block instead.
	/** @type {import('react').ClipboardEventHandler<HTMLButtonElement>} */
	const focusOnCopyEventTarget = ( event ) => {
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
