/**
 * External dependencies
 */
import classnames from 'classnames';
import { deburr, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import { useNavigationContext, useNavigationMenuContext } from './context';
import { ItemBadgeUI, ItemTitleUI, ItemUI } from './styles/navigation-styles';

// @see packages/block-editor/src/components/inserter/search-items.js
const normalizeInput = ( input ) =>
	deburr( input ).replace( /^\//, '' ).toLowerCase();

export default function NavigationItem( {
	badge,
	children,
	className,
	href,
	item,
	navigateToMenu,
	onClick = noop,
	title,
	...props
} ) {
	const { activeItem, setActiveItem, setActiveMenu } = useNavigationContext();
	const { search } = useNavigationMenuContext();

	// Items rendering a custom component aren't currently searchable.
	if ( search && children ) {
		return null;
	}

	if (
		search &&
		title &&
		-1 === normalizeInput( title ).indexOf( normalizeInput( search ) )
	) {
		return null;
	}

	const classes = classnames( 'components-navigation__item', className, {
		'is-active': item && activeItem === item,
	} );

	const onItemClick = () => {
		if ( navigateToMenu ) {
			setActiveMenu( navigateToMenu );
		} else if ( ! href ) {
			setActiveItem( item );
		}
		onClick();
	};

	return (
		<ItemUI className={ classes }>
			<Button href={ href } onClick={ onItemClick } { ...props }>
				{ title && (
					<ItemTitleUI
						className="components-navigation__item-title"
						variant="body.small"
						as="span"
					>
						{ title }
					</ItemTitleUI>
				) }

				{ children }

				{ badge && (
					<ItemBadgeUI className="components-navigation__item-badge">
						{ badge }
					</ItemBadgeUI>
				) }

				{ navigateToMenu && <Icon icon={ chevronRight } /> }
			</Button>
		</ItemUI>
	);
}
