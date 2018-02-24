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

export function MenuItemsGroup( {
	children,
	className = '',
	filterName,
	instanceId,
	label,
} ) {
	const childrenArray = Children.toArray( children );
	const menuItems = filterName ?
		applyFilters( filterName, childrenArray ) :
		childrenArray;

	if ( ! Array.isArray( menuItems ) || ! menuItems.length ) {
		return null;
	}

	const labelId = `components-menu-items-group-label-${ instanceId }`;
	const classNames = classnames( className, 'components-menu-items__group' );

	return (
		<div className={ classNames }>
			{ label &&
				<div className="components-menu-items__group-label" id={ labelId }>{ label }</div>
			}
			<NavigableMenu orientation="vertical" aria-labelledby={ labelId }>
				{ menuItems }
			</NavigableMenu>
		</div>
	);
}

export default withInstanceId( MenuItemsGroup );
