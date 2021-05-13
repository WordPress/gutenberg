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

function MenuIndex( {
	activeItem,
	children,
	className,
	menu,
	onAnimationEnd,
	onMenuChange,
} ) {
	const navigationTree = useCreateNavigationTree();
	const context = {
		activeItem,
		activeMenu: menu,
		setActiveMenu: ( menuId, slideOrigin ) => {
			if ( navigationTree.getMenu( menuId ) ) {
				onMenuChange( menuId, slideOrigin );
			}
		},
		navigationTree,
	};
	return (
		<div
			key={ menu }
			className={ className || '' }
			onAnimationEnd={ onAnimationEnd }
		>
			<NavigationContext.Provider value={ context }>
				{ children }
			</NavigationContext.Provider>
		</div>
	);
}

export default function Navigation( {
	activeItem,
	activeMenu = ROOT_MENU,
	children,
	className,
	onActivateMenu = noop,
} ) {
	const [ menu, setMenu ] = useState( activeMenu );
	const [ slideOrigin, setSlideOrigin ] = useState();
	const defaultSlideOrigin = isRTL() ? 'right' : 'left';
	const [ previous, setPrevious ] = useState();

	const changeMenu = ( menuId, slideInOrigin = defaultSlideOrigin ) => {
		setSlideOrigin( slideInOrigin );
		setMenu( menuId );
		onActivateMenu( menuId );
		if ( isMounted.current ) {
			rootRef.current.style.overflow = 'hidden';
			const props = {
				...active.props,
				className: getAnimateClassName( {
					type: 'slide-out',
					origin: slideInOrigin,
				} ),
				onAnimationEnd: () => setPrevious( null ),
			};
			setPrevious( <MenuIndex { ...props } /> );
		}
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
			changeMenu( activeMenu );
		}
	}, [ activeMenu ] );

	const classes = classnames( 'components-navigation', className );
	const animateClassName = getAnimateClassName( {
		type: 'slide-in',
		origin: slideOrigin,
	} );

	const active = (
		<MenuIndex
			activeItem={ activeItem }
			children={ children }
			className={ isMounted.current && slideOrigin && animateClassName }
			menu={ menu }
			onAnimationEnd={ () => {
				rootRef.current.style.overflow = 'visible';
			} }
			onMenuChange={ changeMenu }
		/>
	);

	const rootRef = useRef();

	return (
		<NavigationUI className={ classes } ref={ rootRef }>
			{ active }
			{ previous }
		</NavigationUI>
	);
}
