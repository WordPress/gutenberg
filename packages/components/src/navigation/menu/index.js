/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { ROOT_MENU } from '../constants';
import { useNavigationContext } from '../context';
import { MenuTitleUI, MenuUI } from '../styles/navigation-styles';
import NavigationBackButton from '../back-button';
import { NavigationMenuContext } from './context';
import { useNavigationTreeMenu } from './use-navigation-tree-menu';

export default function NavigationMenu( props ) {
	const {
		backButtonLabel,
		children,
		className,
		menu = ROOT_MENU,
		parentMenu,
		title,
		onBackButtonClick,
	} = props;
	useNavigationTreeMenu( props );
	const { activeMenu } = useNavigationContext();
	const isActive = activeMenu === menu;

	const classes = classnames( 'components-navigation__menu', className );

	const context = {
		menu,
		isActive,
	};

	// Keep the children rendered to make sure inactive items are included in the navigation tree
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
				{ ( parentMenu || onBackButtonClick ) && (
					<NavigationBackButton
						backButtonLabel={ backButtonLabel }
						parentMenu={ parentMenu }
						onClick={ onBackButtonClick }
					/>
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
