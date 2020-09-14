/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import { useNavigationContext } from './context';
import { ItemBadgeUI, ItemTitleUI, ItemUI } from './styles/navigation-styles';

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
			{ children || (
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
