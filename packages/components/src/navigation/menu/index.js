/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ROOT_MENU } from '../constants';
import { useNavigationContext } from '../context';
import {
	MenuBackButtonUI,
	MenuTitleUI,
	MenuUI,
} from '../styles/navigation-styles';
import { NavigationMenuContext } from './context';
import { useNavigationTreeMenu } from './use-navigation-tree-menu';

export default function NavigationMenu( props ) {
	useNavigationTreeMenu( props );

	const {
		backButtonLabel,
		children,
		className,
		menu = ROOT_MENU,
		parentMenu,
		title,
	} = props;
	const { activeMenu, setActiveMenu } = useNavigationContext();
	const isActive = activeMenu === menu;

	const classes = classnames( 'components-navigation__menu', className );

	const context = {
		menu,
		isActive,
	};

	if ( ! isActive ) {
		return (
			<NavigationMenuContext.Provider value={ context }>
				{ children }
			</NavigationMenuContext.Provider>
		);
	}

	return (
		<NavigationMenuContext.Provider value={ context }>
			<MenuUI className={ classes }>
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
				{ title && (
					<MenuTitleUI
						as="h2"
						className="components-navigation__menu-title"
						variant="subtitle"
					>
						{ title }
					</MenuTitleUI>
				) }
				<ul>{ children }</ul>
			</MenuUI>
		</NavigationMenuContext.Provider>
	);
}
