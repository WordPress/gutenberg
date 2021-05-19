/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
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

export default function Navigation( {
	activeItem,
	activeMenu = ROOT_MENU,
	children,
	className,
	skipAnimation,
	onActivateMenu = noop,
} ) {
	const [ menu, setMenu ] = useState( activeMenu );
	const [ slideOrigin, setSlideOrigin ] = useState();
	const navigationTree = useCreateNavigationTree();
	const defaultSlideOrigin = isRTL() ? 'right' : 'left';

	const setActiveMenu = ( menuId, slideInOrigin = defaultSlideOrigin ) => {
		if ( ! navigationTree.getMenu( menuId ) ) {
			return;
		}

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
		if ( activeMenu !== menu ) {
			setActiveMenu( activeMenu );
		}
	}, [ activeMenu ] );

	const context = {
		activeItem,
		activeMenu: menu,
		setActiveMenu,
		navigationTree,
	};

	const classes = classnames( 'components-navigation', className );
	const animateClassName = getAnimateClassName( {
		type: 'slide-in',
		origin: slideOrigin,
	} );

	return (
		<NavigationUI className={ classes }>
			<div
				key={ menu }
				className={ classnames( {
					[ animateClassName ]:
						isMounted.current && ! skipAnimation && slideOrigin,
				} ) }
			>
				<NavigationContext.Provider value={ context }>
					{ children }
				</NavigationContext.Provider>
			</div>
		</NavigationUI>
	);
}
