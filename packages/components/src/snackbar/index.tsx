import type { ForwardedRef, KeyboardEvent, MouseEvent } from 'react';
import clsx from 'clsx';
import { useIsPresent } from 'framer-motion';
import { speak } from '@wordpress/a11y';
import {
	useEffect,
	useLayoutEffect,
	useRef,
	forwardRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import warning from '@wordpress/warning';
import Button from '../button';
import ExternalLink from '../external-link';
import type { SnackbarProps } from './types';
import type { NoticeAction } from '../notice/types';
import type { WordPressComponentProps } from '../context';

const NOTICE_TIMEOUT = 6000;

/**
 * Custom hook which announces the message with the given politeness, if a
 * valid message is provided. Passing `null` or `undefined` as the message
 * skips the announcement.
 *
 * A non-string message is read from the DOM node the returned ref is attached
 * to, rather than serialized with `renderToString`. Serializing during render
 * invokes the message components as plain functions, so any hooks they use
 * would be registered against the component rendering the snackbar, crashing
 * it when the message changes shape. See
 * https://github.com/WordPress/gutenberg/issues/61199.
 *
 * @param message    Message to announce.
 * @param politeness Politeness to announce.
 */
function useSpokenMessage(
	message: SnackbarProps[ 'spokenMessage' ],
	politeness: NonNullable< SnackbarProps[ 'politeness' ] >
) {
	const messageContainerRef = useRef< HTMLDivElement >( null );
	const previouslySpokenRef = useRef< {
		message: string;
		politeness: NonNullable< SnackbarProps[ 'politeness' ] >;
	} >();

	useEffect( () => {
		let spokenMessage;
		if ( typeof message === 'string' ) {
			spokenMessage = message;
		} else if ( message !== null && message !== undefined ) {
			spokenMessage = messageContainerRef.current?.innerHTML;
		}

		if (
			spokenMessage &&
			( spokenMessage !== previouslySpokenRef.current?.message ||
				politeness !== previouslySpokenRef.current?.politeness )
		) {
			previouslySpokenRef.current = {
				message: spokenMessage,
				politeness,
			};
			speak( spokenMessage, politeness );
		}
	} );

	return messageContainerRef;
}

function UnforwardedSnackbar(
	{
		className,
		children,
		spokenMessage = children,
		politeness = 'polite',
		actions = [],
		onRemove,
		icon = null,
		explicitDismiss = false,
		// onDismiss is a callback executed when the snackbar is dismissed.
		// It is distinct from onRemove, which _looks_ like a callback but is
		// actually the function to call to remove the snackbar from the UI.
		onDismiss,
		listRef,
	}: WordPressComponentProps< SnackbarProps, 'div' >,
	ref: ForwardedRef< any >
) {
	const isPresent = useIsPresent();

	function dismissMe( event: KeyboardEvent | MouseEvent ) {
		if ( event && event.preventDefault ) {
			event.preventDefault();
		}

		// Prevent focus loss by moving it to the list element.
		listRef?.current?.focus();

		onDismiss?.();
		onRemove?.();
	}

	function onActionClick(
		event: MouseEvent< HTMLButtonElement | HTMLAnchorElement >,
		onClick: NoticeAction[ 'onClick' ]
	) {
		event.stopPropagation();

		onRemove?.();

		if ( onClick ) {
			onClick( event );
		}
	}

	const spokenMessageRef = useSpokenMessage( spokenMessage, politeness );

	// When `spokenMessage` is a distinct element (not the default `children`
	// and not a string), it has no place in the rendered output to read the
	// announcement from, so render it in a hidden container.
	const isSpokenMessageDistinctElement =
		typeof spokenMessage !== 'string' &&
		spokenMessage !== children &&
		spokenMessage !== null &&
		spokenMessage !== undefined;

	// The `onDismiss/onRemove` can have unstable references,
	// trigger side-effect cleanup, and reset timers.
	const callbacksRef = useRef( { onDismiss, onRemove } );
	useLayoutEffect( () => {
		callbacksRef.current = { onDismiss, onRemove };
	} );

	useEffect( () => {
		if ( explicitDismiss || ! isPresent ) {
			return;
		}

		const timeoutHandle = setTimeout( () => {
			callbacksRef.current.onDismiss?.();
			callbacksRef.current.onRemove?.();
		}, NOTICE_TIMEOUT );

		return () => clearTimeout( timeoutHandle );
	}, [ explicitDismiss, isPresent ] );

	const classes = clsx( className, 'components-snackbar', {
		'components-snackbar-explicit-dismiss': !! explicitDismiss,
	} );
	if ( actions && actions.length > 1 ) {
		// We need to inform developers that snackbar only accepts 1 action.
		warning(
			'Snackbar can only have one action. Use Notice if your message requires many actions.'
		);
		// return first element only while keeping it inside an array
		actions = [ actions[ 0 ] ];
	}

	const snackbarContentClassnames = clsx( 'components-snackbar__content', {
		'components-snackbar__content-with-icon': !! icon,
	} );

	return (
		<div
			ref={ ref }
			className={ classes }
			onClick={ ! explicitDismiss ? dismissMe : undefined }
			tabIndex={ 0 }
			role={ ! explicitDismiss ? 'button' : undefined }
			onKeyPress={ ! explicitDismiss ? dismissMe : undefined }
			aria-label={
				! explicitDismiss ? __( 'Dismiss this notice' ) : undefined
			}
			data-testid="snackbar"
		>
			<div className={ snackbarContentClassnames }>
				{ icon && (
					<div className="components-snackbar__icon">{ icon }</div>
				) }
				{ /* `display: contents` keeps the wrapper out of the flex
				layout while providing a node scoped to the default spoken
				message (the children) for `useSpokenMessage` to read. */ }
				<div
					ref={
						isSpokenMessageDistinctElement
							? undefined
							: spokenMessageRef
					}
					style={ { display: 'contents' } }
				>
					{ children }
				</div>
				{ isSpokenMessageDistinctElement && (
					<div hidden ref={ spokenMessageRef }>
						{ spokenMessage }
					</div>
				) }
				{ actions.map(
					( { label, onClick, url, openInNewTab = false }, index ) =>
						url !== undefined && openInNewTab ? (
							<ExternalLink
								key={ index }
								href={ url }
								onClick={ ( event ) =>
									onActionClick( event, onClick )
								}
								className="components-snackbar__action"
							>
								{ label }
							</ExternalLink>
						) : (
							<Button
								__next40pxDefaultSize
								key={ index }
								href={ url }
								variant="link"
								onClick={ (
									event: MouseEvent< HTMLButtonElement >
								) => onActionClick( event, onClick ) }
								className="components-snackbar__action"
							>
								{ label }
							</Button>
						)
				) }
				{ explicitDismiss && (
					<span
						role="button"
						aria-label={ __( 'Dismiss this notice' ) }
						tabIndex={ 0 }
						className="components-snackbar__dismiss-button"
						onClick={ dismissMe }
						onKeyPress={ dismissMe }
					>
						&#x2715;
					</span>
				) }
			</div>
		</div>
	);
}

/**
 * A Snackbar displays a succinct message that is cleared out after a small delay.
 *
 * It can also offer the user options, like viewing a published post.
 * But these options should also be available elsewhere in the UI.
 *
 * ```jsx
 * const MySnackbarNotice = () => (
 *   <Snackbar>Post published successfully.</Snackbar>
 * );
 * ```
 */
export const Snackbar = forwardRef( UnforwardedSnackbar );
Snackbar.displayName = 'Snackbar';

export default Snackbar;
