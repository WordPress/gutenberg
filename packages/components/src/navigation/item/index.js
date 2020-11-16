/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { useNavigationContext } from '../context';
import { ItemBaseUI } from '../styles/navigation-styles';
import { useRTL } from '../../utils/rtl';
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
		...restProps
	} = props;

	const {
		activeItem,
		setActiveMenu,
		navigationTree: { isMenuEmpty },
	} = useNavigationContext();
	const isRTL = useRTL();

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
	const icon = isRTL ? chevronLeft : chevronRight;

	return (
		<NavigationItemBase { ...props } className={ classes }>
			{ children || (
				<ItemBaseUI
					as={ Button }
					href={ href }
					onClick={ onItemClick }
					{ ...restProps }
				>
					<NavigationItemBaseContent
						title={ title }
						badge={ badge }
						isRTL={ isRTL }
					/>

					{ navigateToMenu && <Icon icon={ icon } /> }
				</ItemBaseUI>
			) }
		</NavigationItemBase>
	);
}
