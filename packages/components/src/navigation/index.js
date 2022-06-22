/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
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

	// Used to prevent excessive useEffect fires when navigation is being controlled by parent component
	const controlledMenuUpdate = useRef( { setActiveMenu, menu } );
	useLayoutEffect( () => {
		controlledMenuUpdate.current = { setActiveMenu, menu };
	} );

	useEffect( () => {
		if ( activeMenu !== controlledMenuUpdate.current.menu ) {
			controlledMenuUpdate.current.setActiveMenu( activeMenu );
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
