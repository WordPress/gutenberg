/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Animate from '../animate';
import { ROOT_MENU } from './constants';
import { NavigationContext } from './context';
import { NavigationUI } from './styles/navigation-styles';
import { findNavigationItems, findNavigationMenus } from './children-utils';

export default function Navigation( {
	activeItem,
	activeMenu = ROOT_MENU,
	children,
	className,
	onActivateItem = noop,
	onActivateMenu = noop,
} ) {
	const [ item, setItem ] = useState( activeItem );
	const [ menu, setMenu ] = useState( activeMenu );
	const [ slideOrigin, setSlideOrigin ] = useState();
	const [ navigationItems, setNavigationItems ] = useState( {} );
	const [ navigationMenus, setNavigationMenus ] = useState( {} );

	const setActiveItem = ( itemId ) => {
		setItem( itemId );
		onActivateItem( itemId );
	};

	const setActiveMenu = ( menuId, slideInOrigin = 'left' ) => {
		setSlideOrigin( slideInOrigin );
		setMenu( menuId );
		onActivateMenu( menuId );
	};

	// Used to prevent the sliding animation on mount
	const isMounted = useRef( false );
	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
		}
	}, [] );

	useEffect( () => {
		if ( activeItem !== item ) {
			setActiveItem( activeItem );
		}
		if ( activeMenu !== menu ) {
			setActiveMenu( activeMenu );
		}
	}, [ activeItem, activeMenu ] );

	useEffect( () => {
		const items = findNavigationItems( children );
		const menus = findNavigationMenus( children );

		setNavigationItems( items );
		setNavigationMenus( menus );
	}, [] );

	const context = {
		activeItem: item,
		activeMenu: menu,
		setActiveItem,
		setActiveMenu,
		items: navigationItems,
		menus: navigationMenus,
	};

	const classes = classnames( 'components-navigation', className );

	return (
		<NavigationUI className={ classes }>
			<Animate
				key={ menu }
				type="slide-in"
				options={ { origin: slideOrigin } }
			>
				{ ( { className: animateClassName } ) => (
					<div
						className={ classnames( {
							[ animateClassName ]:
								isMounted.current && slideOrigin,
						} ) }
					>
						<NavigationContext.Provider value={ context }>
							{ children }
						</NavigationContext.Provider>
					</div>
				) }
			</Animate>
		</NavigationUI>
	);
}
