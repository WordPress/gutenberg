/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from '../';

const NOTICE_TIMEOUT = 10000;

function Snackbar( {
	className,
	children,
	actions = [],
	onRemove = noop,
}, ref ) {
	useEffect( () => {
		const timeoutHandle = setTimeout( () => {
			onRemove();
		}, NOTICE_TIMEOUT );

		return () => clearTimeout( timeoutHandle );
	}, [] );

	const classes = classnames( className, 'components-snackbar' );
	if ( actions && actions.length > 1 ) {
		// we need to inform developers that snackbar only accepts 1 action
		// eslint-disable-next-line no-console
		console.warn( 'Snackbar can only have 1 action, use Notice if your message require many messages' );
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
				{ actions.map(
					(
						{
							label,
							onClick,
							url,
						},
						index
					) => {
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
					}

				) }
			</div>
		</div>
	);
}

export default forwardRef( Snackbar );
