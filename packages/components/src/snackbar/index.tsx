/**
 * External dependencies
 */
import type { ForwardedRef, KeyboardEvent, MouseEvent } from 'react';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { useEffect, forwardRef, renderToString } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import Button from '../button';
import type { SnackbarProps } from './types';
import type { NoticeAction } from '../notice/types';
import type { WordPressComponentProps } from '../ui/context';

const NOTICE_TIMEOUT = 10000;

/**
 * Custom hook which announces the message with the given politeness, if a
 * valid message is provided.
 *
 * @param message    Message to announce.
 * @param politeness Politeness to announce.
 */
function useSpokenMessage(
	message: SnackbarProps[ 'spokenMessage' ],
	politeness: NonNullable< SnackbarProps[ 'politeness' ] >
) {
	const spokenMessage =
		typeof message === 'string' ? message : renderToString( message );

	useEffect( () => {
		if ( spokenMessage ) {
			speak( spokenMessage, politeness );
		}
	}, [ spokenMessage, politeness ] );
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
		event: MouseEvent< HTMLButtonElement >,
		onClick: NoticeAction[ 'onClick' ]
	) {
		event.stopPropagation();

		onRemove?.();

		if ( onClick ) {
			onClick( event );
		}
	}

	useSpokenMessage( spokenMessage, politeness );

	// Only set up the timeout dismiss if we're not explicitly dismissing.
	useEffect( () => {
		const timeoutHandle = setTimeout( () => {
			if ( ! explicitDismiss ) {
				onDismiss?.();
				onRemove?.();
			}
		}, NOTICE_TIMEOUT );

		return () => clearTimeout( timeoutHandle );
	}, [ onDismiss, onRemove, explicitDismiss ] );

	const classes = classnames( className, 'components-snackbar', {
		'components-snackbar-explicit-dismiss': !! explicitDismiss,
	} );
	if ( actions && actions.length > 1 ) {
		// We need to inform developers that snackbar only accepts 1 action.
		warning(
			'Snackbar can only have 1 action, use Notice if your message require many messages'
		);
		// return first element only while keeping it inside an array
		actions = [ actions[ 0 ] ];
	}

	const snackbarContentClassnames = classnames(
		'components-snackbar__content',
		{
			'components-snackbar__content-with-icon': !! icon,
		}
	);

	return (
		<div
			ref={ ref }
			className={ classes }
			onClick={ ! explicitDismiss ? dismissMe : undefined }
			tabIndex={ 0 }
			role={ ! explicitDismiss ? 'button' : '' }
			onKeyPress={ ! explicitDismiss ? dismissMe : undefined }
			aria-label={ ! explicitDismiss ? __( 'Dismiss this notice' ) : '' }
		>
			<div className={ snackbarContentClassnames }>
				{ icon && (
					<div className="components-snackbar__icon">{ icon }</div>
				) }
				{ children }
				{ actions.map( ( { label, onClick, url }, index ) => {
					return (
						<Button
							key={ index }
							href={ url }
							variant="tertiary"
							onClick={ (
								event: MouseEvent< HTMLButtonElement >
							) => onActionClick( event, onClick ) }
							className="components-snackbar__action"
						>
							{ label }
						</Button>
					);
				} ) }
				{ explicitDismiss && (
					<span
						role="button"
						aria-label="Dismiss this notice"
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

export default Snackbar;
