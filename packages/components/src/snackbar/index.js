/**
 * External dependencies
 */
import { noop } from 'lodash';
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
import { Button } from '../';

const NOTICE_TIMEOUT = 10000;

/** @typedef {import('@wordpress/element').WPElement} WPElement */

/**
 * Custom hook which announces the message with the given politeness, if a
 * valid message is provided.
 *
 * @param {string|WPElement}     [message]  Message to announce.
 * @param {'polite'|'assertive'} politeness Politeness to announce.
 */
function useSpokenMessage( message, politeness ) {
	const spokenMessage =
		typeof message === 'string' ? message : renderToString( message );

	useEffect( () => {
		if ( spokenMessage ) {
			speak( spokenMessage, politeness );
		}
	}, [ spokenMessage, politeness ] );
}

function Snackbar(
	{
		className,
		children,
		spokenMessage = children,
		politeness = 'polite',
		actions = [],
		onRemove = noop,
		icon = null,
		explicitDismiss = false,
		// onDismiss is a callback executed when the snackbar is dismissed.
		// It is distinct from onRemove, which _looks_ like a callback but is
		// actually the function to call to remove the snackbar from the UI.
		onDismiss = noop,
	},
	ref
) {
	onDismiss = onDismiss || noop;

	function dismissMe( event ) {
		if ( event && event.preventDefault ) {
			event.preventDefault();
		}

		onDismiss();
		onRemove();
	}

	function onActionClick( event, onClick ) {
		event.stopPropagation();

		onRemove();

		if ( onClick ) {
			onClick( event );
		}
	}

	useSpokenMessage( spokenMessage, politeness );

	// Only set up the timeout dismiss if we're not explicitly dismissing.
	useEffect( () => {
		const timeoutHandle = setTimeout( () => {
			if ( ! explicitDismiss ) {
				onDismiss();
				onRemove();
			}
		}, NOTICE_TIMEOUT );

		return () => clearTimeout( timeoutHandle );
	}, [ onDismiss, onRemove ] );

	const classes = classnames( className, 'components-snackbar', {
		'components-snackbar-explicit-dismiss': !! explicitDismiss,
	} );
	if ( actions && actions.length > 1 ) {
		// we need to inform developers that snackbar only accepts 1 action
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
			onClick={ ! explicitDismiss ? dismissMe : noop }
			tabIndex="0"
			role={ ! explicitDismiss ? 'button' : '' }
			onKeyPress={ ! explicitDismiss ? dismissMe : noop }
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
							onClick={ ( event ) =>
								onActionClick( event, onClick )
							}
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
						tabIndex="0"
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

export default forwardRef( Snackbar );
