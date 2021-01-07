/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

export function MenuGroup( {
	children,
	className = '',
	label,
	role = 'group',
} ) {
	const instanceId = useInstanceId( MenuGroup );

	if ( ! Children.count( children ) ) {
		return null;
	}

	const labelId = `components-menu-group-label-${ instanceId }`;
	const classNames = classnames( className, 'components-menu-group' );

	return (
		<div className={ classNames }>
			{ label && (
				<div
					className="components-menu-group__label"
					id={ labelId }
					aria-hidden="true"
				>
					{ label }
				</div>
			) }
			<div role={ role } aria-labelledby={ label ? labelId : null }>
				{ children }
			</div>
		</div>
	);
}

export default MenuGroup;
