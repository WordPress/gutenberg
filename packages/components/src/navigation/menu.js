/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ROOT_MENU } from './constants';
import { NavigationMenuContext, useNavigationContext } from './context';
import NavigationMenuTitle from './menu-title';
import { MenuBackButtonUI, MenuUI } from './styles/navigation-styles';

export default function NavigationMenu( {
	backButtonLabel,
	children,
	className,
	menu = ROOT_MENU,
	parentMenu,
	hasSearch,
	title,
} ) {
	const [ search, setSearch ] = useState( '' );
	const { activeMenu, setActiveMenu } = useNavigationContext();

	if ( activeMenu !== menu ) {
		return null;
	}

	const context = { search };

	const classes = classnames( 'components-navigation__menu', className );

	return (
		<div className={ classes }>
			{ parentMenu && (
				<MenuBackButtonUI
					className="components-navigation__back-button"
					isTertiary
					onClick={ () => setActiveMenu( parentMenu, 'right' ) }
				>
					<Icon icon={ chevronLeft } />
					{ backButtonLabel || __( 'Back' ) }
				</MenuBackButtonUI>
			) }
			<MenuUI>
				<NavigationMenuTitle
					hasSearch={ hasSearch }
					search={ search }
					setSearch={ setSearch }
					title={ title }
				/>
				<NavigationMenuContext.Provider value={ context }>
					{ children }
				</NavigationMenuContext.Provider>
			</MenuUI>
		</div>
	);
}
