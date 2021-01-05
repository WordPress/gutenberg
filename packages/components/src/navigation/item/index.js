/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

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
import { ItemUI } from '../styles/navigation-styles';
import NavigationItemBaseContent from './base-content';
import NavigationItemBase from './base';

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
	// Is marked as empty, then we skip rendering the item
	if (
		hideIfTargetMenuEmpty &&
		navigateToMenu &&
		isMenuEmpty( navigateToMenu )
	) {
		return null;
	}

	const classes = classnames( className, {
		'is-active': item && activeItem === item,
	} );

	const onItemClick = ( event ) => {
		if ( navigateToMenu ) {
			setActiveMenu( navigateToMenu );
		}

		onClick( event );
	};
	const icon = isRTL() ? chevronLeft : chevronRight;
	const baseProps = isText
		? restProps
		: { as: Button, href, onClick: onItemClick, ...restProps };

	return (
		<NavigationItemBase { ...props } className={ classes }>
			{ children || (
				<ItemUI { ...baseProps }>
					<NavigationItemBaseContent
						title={ title }
						badge={ badge }
					/>

					{ navigateToMenu && <Icon icon={ icon } /> }
				</ItemUI>
			) }
		</NavigationItemBase>
	);
}
