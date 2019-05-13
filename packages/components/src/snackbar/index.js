/**
 * External dependencies
 */
import { flow, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../';

const stopPropagation = ( event ) => event.stopPropagation();

function Snackbar( {
	className,
	status,
	children,
	actions = [],
	__unstableHTML,
	onRemove = noop,
} ) {
	const classes = classnames( className, 'components-snackbar', 'is-' + status );

	if ( __unstableHTML ) {
		children = <RawHTML>{ children }</RawHTML>;
	}

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
								onClick={ url ? stopPropagation : flow( stopPropagation, onClick ) }
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
