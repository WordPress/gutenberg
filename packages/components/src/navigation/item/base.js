/**
 * External dependencies
 */
import classnames from 'classnames';
import { uniqueId } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigationContext } from '../context';
import { useNavigationTreeItem } from './use-navigation-tree-item';
import { ItemBaseUI } from '../styles/navigation-styles';

export default function NavigationItemBase( props ) {
	const { children, className, ...restProps } = props;

	const [ itemId ] = useState( uniqueId( 'item-' ) );

	useNavigationTreeItem( itemId, props );
	const { navigationTree } = useNavigationContext();

	if ( ! navigationTree.getItem( itemId )?._isVisible ) {
		return null;
	}

	const classes = classnames( 'components-navigation__item', className );

	return (
		<ItemBaseUI className={ classes } { ...restProps }>
			{ children }
		</ItemBaseUI>
	);
}
