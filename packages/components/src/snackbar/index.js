/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

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
} ) {
	useEffect( () => {
		// This rule doesn't account yet for React Hooks
		// eslint-disable-next-line @wordpress/react-no-unsafe-timeout
		const timeoutHandle = setTimeout( () => {
			onRemove();
		}, NOTICE_TIMEOUT );

		return () => clearTimeout( timeoutHandle );
	}, [] );

	const classes = classnames( className, 'components-snackbar' );

	return (
		<div
			className={ classes }
			onClick={ onRemove }
			tabIndex="0"
			role="button"
			onKeyPress={ onRemove }
		>
			<div className="components-snackbar__content">
				{ children }
				{ actions.map(
					(
						{
							className: buttonCustomClasses,
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
								className={ classnames(
									'components-snackbar__action',
									buttonCustomClasses
								) }
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

export default Snackbar;
