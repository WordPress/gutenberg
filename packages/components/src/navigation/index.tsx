/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { useEffect, useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getAnimateClassName } from '../animate';
import { ROOT_MENU } from './constants';
import { NavigationContext } from './context';
import { NavigationUI } from './styles/navigation-styles';
import { useCreateNavigationTree } from './use-create-navigation-tree';

import type {
	NavigationProps,
	NavigationContext as NavigationContextType,
} from './types';

const noop = () => {};

/**
 * Render a navigation list with optional groupings and hierarchy.
 *
 * @deprecated Use `Navigator` instead.
 *
 * ```jsx
 * import {
 *   __experimentalNavigation as Navigation,
 *   __experimentalNavigationGroup as NavigationGroup,
 *   __experimentalNavigationItem as NavigationItem,
 *   __experimentalNavigationMenu as NavigationMenu,
 * } from '@wordpress/components';
 *
 * const MyNavigation = () => (
 *   <Navigation>
 *     <NavigationMenu title="Home">
 *       <NavigationGroup title="Group 1">
 *         <NavigationItem item="item-1" title="Item 1" />
 *         <NavigationItem item="item-2" title="Item 2" />
 *       </NavigationGroup>
 *       <NavigationGroup title="Group 2">
 *         <NavigationItem
 *           item="item-3"
 *           navigateToMenu="category"
 *           title="Category"
 *         />
 *       </NavigationGroup>
 *     </NavigationMenu>
 *
 *     <NavigationMenu
 *       backButtonLabel="Home"
 *       menu="category"
 *       parentMenu="root"
 *       title="Category"
 *     >
 *       <NavigationItem badge="1" item="child-1" title="Child 1" />
 *       <NavigationItem item="child-2" title="Child 2" />
 *     </NavigationMenu>
 *   </Navigation>
 * );
 * ```
 */
export function Navigation( {
	activeItem,
	activeMenu = ROOT_MENU,
	children,
	className,
	onActivateMenu = noop,
}: NavigationProps ) {
	const [ menu, setMenu ] = useState( activeMenu );
	const [ slideOrigin, setSlideOrigin ] = useState< 'left' | 'right' >();
	const navigationTree = useCreateNavigationTree();
	const defaultSlideOrigin = isRTL() ? 'right' : 'left';

	deprecated( 'wp.components.Navigation (and all subcomponents)', {
		since: '6.8',
		version: '7.1',
		alternative: 'wp.components.Navigator',
	} );

	const setActiveMenu: NavigationContextType[ 'setActiveMenu' ] = (
		menuId,
		slideInOrigin = defaultSlideOrigin
	) => {
		if ( ! navigationTree.getMenu( menuId ) ) {
			return;
		}

		setSlideOrigin( slideInOrigin );
		setMenu( menuId );
		onActivateMenu( menuId );
	};

	// Used to prevent the sliding animation on mount
	const isMountedRef = useRef( false );
	useEffect( () => {
		if ( ! isMountedRef.current ) {
			isMountedRef.current = true;
		}
	}, [] );

	useEffect( () => {
		if ( activeMenu !== menu ) {
			setActiveMenu( activeMenu );
		}
		// Not adding deps for now, as it would require either a larger refactor or some questionable workarounds.
		// See https://github.com/WordPress/gutenberg/pull/41612 for context.
	}, [ activeMenu ] );

	const context = {
		activeItem,
		activeMenu: menu,
		setActiveMenu,
		navigationTree,
	};

	const classes = clsx( 'components-navigation', className );
	const animateClassName = getAnimateClassName( {
		type: 'slide-in',
		origin: slideOrigin,
	} );

	return (
		<NavigationUI className={ classes }>
			<div
				key={ menu }
				className={
					animateClassName
						? clsx( {
								[ animateClassName ]:
									isMountedRef.current && slideOrigin,
						  } )
						: undefined
				}
			>
				<NavigationContext.Provider value={ context }>
					{ children }
				</NavigationContext.Provider>
			</div>
		</NavigationUI>
	);
}

export default Navigation;
