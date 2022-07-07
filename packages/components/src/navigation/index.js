/**
 * External dependencies
 */
import classnames from 'classnames';

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

const noop = () => {};

export default function Navigation( {
	activeItem,
	activeMenu = ROOT_MENU,
	children,
	className,
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
		// Ignore exhaustive-deps here, as it would require either a larger refactor or some questionable workarounds.
		// See https://github.com/WordPress/gutenberg/pull/41612 for context.
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
					[ animateClassName ]: isMounted.current && slideOrigin,
				} ) }
			>
				<NavigationContext.Provider value={ context }>
					{ children }
				</NavigationContext.Provider>
			</div>
		</NavigationUI>
	);
}
