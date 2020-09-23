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
import { ROOT_MENU } from '../constants';
import { NavigationMenuContext } from './context';
import { useNavigationContext } from '../context';
import { useNavigationTreeMenu } from './use-navigation-tree-menu';
import NavigationBackButton from '../back-button';
import NavigationMenuTitle from './menu-title';
import { MenuUI } from '../styles/navigation-styles';

export default function NavigationMenu( props ) {
	const {
		backButtonLabel,
		children,
		className,
		hasSearch,
		menu = ROOT_MENU,
		onSearch: setControlledSearch,
		parentMenu,
		search: controlledSearch,
		title,
		onBackButtonClick,
	} = props;
	const [ uncontrolledSearch, setUncontrolledSearch ] = useState( '' );
	useNavigationTreeMenu( props );
	const { activeMenu } = useNavigationContext();

	const context = {
		menu,
		search: uncontrolledSearch,
	};

	// Keep the children rendered to make sure invisible items are included in the navigation tree
	if ( activeMenu !== menu ) {
		return (
			<NavigationMenuContext.Provider value={ context }>
				{ children }
			</NavigationMenuContext.Provider>
		);
	}

	const isControlledSearch = !! setControlledSearch;
	const search = isControlledSearch ? controlledSearch : uncontrolledSearch;
	const onSearch = isControlledSearch
		? setControlledSearch
		: setUncontrolledSearch;

	const classes = classnames( 'components-navigation__menu', className );

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

				<NavigationMenuTitle
					hasSearch={ hasSearch }
					onSearch={ onSearch }
					search={ search }
					title={ title }
				/>

				<ul>{ children }</ul>
			</MenuUI>
		</NavigationMenuContext.Provider>
	);
}
