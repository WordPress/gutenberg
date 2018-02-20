/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './style.scss';
import { NavigableMenu } from '../navigable-container';
import withInstanceId from '../higher-order/with-instance-id';

function MenuItemsGroup( {
	label,
	children,
	instanceId,
	className = '',
	filterName,
} ) {
	const labelId = `components-menu-items-group-label-${ instanceId }`;
	const classNames = classnames( className, 'components-menu-items-group' );
	const menuItems = filterName ? applyFilters( filterName, Children.toArray( children ) ) : children;

	return (
		<div className={ classNames }>
			{ label &&
				<div className="components-menu-items-group__label" id={ labelId }>{ label }</div>
			}
			<NavigableMenu orientation="vertical" aria-labelledby={ labelId }>
				{ menuItems }
			</NavigableMenu>
		</div>
	);
}

export default withInstanceId( MenuItemsGroup );
