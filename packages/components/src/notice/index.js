/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML, useEffect, renderToString } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button } from '../';

/**
 * Custom hook which announces the message with the given politeness, if a
 * valid message is provided.
 *
 * @param {string}               [message]  Message to announce.
 * @param {'polite'|'assertive'} politeness Politeness to announce.
 */
function useSpokenMessage( message, politeness ) {
	useEffect( () => {
		if ( ! message ) {
			return;
		}

		if ( typeof message !== 'string' ) {
			message = renderToString( message );
		}

		speak( message, politeness );
	}, [ message, politeness ] );
}

/**
 * Given a notice status, returns an assumed default politeness for the status.
 * Defaults to 'assertive'.
 *
 * @param {string} [status] Notice status.
 *
 * @return {'polite'|'assertive'} Notice politeness.
 */
function getDefaultPoliteness( status ) {
	switch ( status ) {
		case 'success':
		case 'warning':
		case 'info':
			return 'polite';

		case 'error':
		default:
			return 'assertive';
	}
}

function Notice( {
	className,
	status = 'info',
	children,
	onRemove = noop,
	isDismissible = true,
	actions = [],
	politeness = getDefaultPoliteness( status ),
	__unstableHTML,
} ) {
	useSpokenMessage( children, politeness );

	const classes = classnames(
		className,
		'components-notice',
		'is-' + status,
		{
			'is-dismissible': isDismissible,
		}
	);

	if ( __unstableHTML ) {
		children = <RawHTML>{ children }</RawHTML>;
	}

	return (
		<div className={ classes }>
			<div className="components-notice__content">
				{ children }
				{ actions.map(
					(
						{
							className: buttonCustomClasses,
							label,
							noDefaultClasses = false,
							onClick,
							url,
						},
						index
					) => {
						return (
							<Button
								key={ index }
								href={ url }
								isSecondary={ ! noDefaultClasses && ! url }
								isLink={ ! noDefaultClasses && !! url }
								onClick={ url ? undefined : onClick }
								className={ classnames(
									'components-notice__action',
									buttonCustomClasses
								) }
							>
								{ label }
							</Button>
						);
					}
				) }
			</div>
			{ isDismissible && (
				<Button
					className="components-notice__dismiss"
					icon={ close }
					label={ __( 'Dismiss this notice' ) }
					onClick={ onRemove }
					showTooltip={ false }
				/>
			) }
		</div>
	);
}

export default Notice;
