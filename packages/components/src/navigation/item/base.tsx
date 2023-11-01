/**
 * External dependencies
 */
import classnames from 'classnames';

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

import type { NavigationItemBaseProps } from '../types';

let uniqueId = 0;

export default function NavigationItemBase( props: NavigationItemBaseProps ) {
	// Also avoid to pass the `title` and `href` props to the ItemBaseUI styled component.
	const { children, className, title, href, ...restProps } = props;

	const [ itemId ] = useState( `item-${ ++uniqueId }` );

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
