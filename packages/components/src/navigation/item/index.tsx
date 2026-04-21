/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { useNavigationContext } from '../context';
import { ItemUI, ItemIconUI } from '../styles/navigation-styles';
import NavigationItemBaseContent from './base-content';
import NavigationItemBase from './base';

import type { NavigationItemProps } from '../types';

const noop = () => {};

/**
 * @deprecated Use `Navigator` instead.
 */
export function NavigationItem( props: NavigationItemProps ) {
	const {
		badge,
		children,
		className,
		href,
		item,
		navigateToMenu,
		onClick = noop,
		title,
		icon,
		hideIfTargetMenuEmpty,
		isText,
		...restProps
	} = props;

	const {
		activeItem,
		setActiveMenu,
		navigationTree: { isMenuEmpty },
	} = useNavigationContext();

	// If hideIfTargetMenuEmpty prop is true
	// And the menu we are supposed to navigate to
	// Is marked as empty, then we skip rendering the item.
	if (
		hideIfTargetMenuEmpty &&
		navigateToMenu &&
		isMenuEmpty( navigateToMenu )
	) {
		return null;
	}

	const isActive = item && activeItem === item;

	const classes = clsx( className, {
		'is-active': isActive,
	} );

	const onItemClick: React.MouseEventHandler<
		HTMLButtonElement | HTMLAnchorElement
	> = ( event ) => {
		if ( navigateToMenu ) {
			setActiveMenu( navigateToMenu );
		}

		onClick( event );
	};
	const navigationIcon = isRTL() ? chevronLeft : chevronRight;
	const baseProps = children ? props : { ...props, onClick: undefined };
	const itemProps = isText
		? restProps
		: {
				as: Button,
				__next40pxDefaultSize:
					'as' in restProps ? restProps.as === undefined : true,
				href,
				onClick: onItemClick,
				'aria-current': isActive ? 'page' : undefined,
				...restProps,
		  };

	return (
		<NavigationItemBase { ...baseProps } className={ classes }>
			{ children || (
				<ItemUI { ...itemProps }>
					{ icon && (
						<ItemIconUI>
							<Icon icon={ icon } />
						</ItemIconUI>
					) }

					<NavigationItemBaseContent
						title={ title }
						badge={ badge }
					/>

					{ navigateToMenu && <Icon icon={ navigationIcon } /> }
				</ItemUI>
			) }
		</NavigationItemBase>
	);
}

export default NavigationItem;
