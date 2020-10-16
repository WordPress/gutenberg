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
import {
	SnackbarActionButton,
	SnackbarContent,
	SnackbarWrapper,
} from './styles/snackbar-styles';

const NOTICE_TIMEOUT = 10000;

/** @typedef {import('@wordpress/element').WPElement} WPElement */

/**
 * Custom hook which announces the message with the given politeness, if a
 * valid message is provided.
 *
 * @param {string | WPElement}     [message]  Message to announce.
 * @param {'polite' | 'assertive'} politeness Politeness to announce.
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

/** @typedef {{label: string, onClick: () => void, url: string}} Action */

/**
 * @typedef Props
 * @property {string} [className] Optional classname passed to the component.
 * @property {import('react').ReactNode} children The message to render.
 * @property {string | WPElement} [spokenMessage] Message to speak if different from children.
 * @property {'polite' | 'assertive'} [politeness='polite'] Politeness with which to speak the message.
 * @property {[Action]|[]} [actions=[]] Optional actions for the snackbar.
 * @property {() => void} [onRemove] Function to run when the snackbar is clicked or keypressed.
 */

/**
 * @param {Props} props
 * @param {import('react').Ref<HTMLDivElement>} ref
 */
function Snackbar(
	{
		className,
		children,
		spokenMessage = children,
		politeness = 'polite',
		actions = [],
		onRemove = noop,
	},
	ref
) {
	useSpokenMessage( spokenMessage, politeness );
	useEffect( () => {
		const timeoutHandle = setTimeout( () => {
			onRemove();
		}, NOTICE_TIMEOUT );

		return () => clearTimeout( timeoutHandle );
	}, [] );

	const classes = classnames( className, 'components-snackbar' );
	if ( actions && actions.length > 1 ) {
		// we need to inform developers that snackbar only accepts 1 action
		warning(
			'Snackbar can only have 1 action, use Notice if your message require many messages'
		);
		// return first element only while keeping it inside an array
		actions = [ actions[ 0 ] ];
	}

	return (
		<SnackbarWrapper
			ref={ ref }
			className={ classes }
			onClick={ onRemove }
			tabIndex="0"
			role="button"
			onKeyPress={ onRemove }
			aria-label={ __( 'Dismiss this notice' ) }
		>
			<SnackbarContent className="components-snackbar__content">
				{ children }
				{ actions.map( ( { label, onClick, url }, index ) => {
					return (
						<SnackbarActionButton
							key={ index }
							href={ url }
							isTertiary
							onClick={ ( event ) => {
								event.stopPropagation();
								if ( onClick ) {
									onClick( event );
								}
							} }
							className="components-snackbar__action"
						>
							{ label }
						</SnackbarActionButton>
					);
				} ) }
			</SnackbarContent>
		</SnackbarWrapper>
	);
}

export default forwardRef( Snackbar );
