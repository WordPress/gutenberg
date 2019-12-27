/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../';

function Notice( {
	className,
	status,
	children,
	onRemove = noop,
	isDismissible = true,
	actions = [],
	__unstableHTML,
} ) {
	const classes = classnames( className, 'components-notice', 'is-' + status, {
		'is-dismissible': isDismissible,
	} );

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
					icon="no-alt"
					label={ __( 'Dismiss this notice' ) }
					onClick={ onRemove }
					showTooltip={ false }
				/>
			) }
		</div>
	);
}

export default Notice;
