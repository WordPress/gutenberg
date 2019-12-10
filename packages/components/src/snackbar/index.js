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
		<div
			ref={ ref }
			className={ classes }
			onClick={ onRemove }
			tabIndex="0"
			role="button"
			onKeyPress={ onRemove }
			label={ __( 'Dismiss this notice' ) }
		>
			<div className="components-snackbar__content">
				{ children }
				{ actions.map( ( { label, onClick, url }, index ) => {
					return (
						<Button
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
						</Button>
					);
				} ) }
			</div>
		</div>
	);
}

export default forwardRef( Snackbar );
