/**
 * External dependencies
 */
import classnames from 'classnames';
import { deburr, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { useNavigationContext } from '../context';
import { useNavigationMenuContext } from '../menu/context';
import { useNavigationTreeItem } from './use-navigation-tree-item';
import { ItemBadgeUI, ItemTitleUI, ItemUI } from '../styles/navigation-styles';

// @see packages/block-editor/src/components/inserter/search-items.js
const normalizeInput = ( input ) =>
	deburr( input ).replace( /^\//, '' ).toLowerCase();

export default function NavigationItem( props ) {
	const {
		badge,
		children,
		className,
		href,
		item,
		navigateToMenu,
		onClick = noop,
		title,
		...restProps
	} = props;
	useNavigationTreeItem( props );
	const { activeItem, setActiveMenu } = useNavigationContext();
	const { isActive, search } = useNavigationMenuContext();
	const itemRef = useRef( null );

	// If this item is in an inactive menu, then we skip rendering
	// We need to make sure this component gets mounted though
	// To make sure inactive items are included in the navigation tree
	if ( ! isActive ) {
		return null;
	}

	if ( search ) {
		const searchQuery = normalizeInput( search );
		if ( title && -1 === normalizeInput( title ).indexOf( searchQuery ) ) {
			return null;
		}
		if (
			children &&
			-1 ===
				normalizeInput( itemRef?.current?.textContent ).indexOf(
					searchQuery
				)
		) {
			return null;
		}
	}

	const classes = classnames( 'components-navigation__item', className, {
		'is-active': item && activeItem === item,
	} );

	const onItemClick = ( event ) => {
		if ( navigateToMenu ) {
			setActiveMenu( navigateToMenu );
		}

		onClick( event );
	};

	return (
		<ItemUI className={ classes } ref={ itemRef }>
			{ children || (
				<Button href={ href } onClick={ onItemClick } { ...restProps }>
					{ title && (
						<ItemTitleUI
							className="components-navigation__item-title"
							variant="body.small"
							as="span"
						>
							{ title }
						</ItemTitleUI>
					) }

					{ badge && (
						<ItemBadgeUI className="components-navigation__item-badge">
							{ badge }
						</ItemBadgeUI>
					) }

					{ navigateToMenu && <Icon icon={ chevronRight } /> }
				</Button>
			) }
		</ItemUI>
	);
}
