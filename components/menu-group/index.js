/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './style.scss';
import { NavigableMenu } from '../navigable-container';

export function MenuGroup( {
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

	const labelId = `components-menu-group-label-${ instanceId }`;
	const classNames = classnames( className, 'components-menu-group' );

	return (
		<div className={ classNames }>
			{ label &&
				<div className="components-menu-group__label" id={ labelId }>{ label }</div>
			}
			<NavigableMenu orientation="vertical" aria-labelledby={ labelId }>
				{ menuItems }
			</NavigableMenu>
		</div>
	);
}

export default withInstanceId( MenuGroup );
