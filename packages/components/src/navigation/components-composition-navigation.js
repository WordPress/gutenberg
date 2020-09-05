/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Animate from '../animate';
import {
	BackButtonUI,
	BadgeUI,
	MenuItemTitleUI,
	MenuItemUI,
	MenuTitleUI,
	MenuUI,
	Root,
} from './styles/navigation-styles';
import Button from '../button';

const DEFAULT_LEVEL = 'root';

const NavigationContext = createContext( {
	activeItem: undefined,
	activeLevel: DEFAULT_LEVEL,
	setActiveItem: noop,
	setActiveLevel: noop,
} );

export default function ComponentsCompositionNavigation( {
	children,
	activeItem,
	activeLevel = DEFAULT_LEVEL,
	setActiveItem = noop,
	setActiveLevel = noop,
} ) {
	const [ item, setItem ] = useState( activeItem );
	const [ level, setLevel ] = useState( activeLevel );
	const [ slideOrigin, setSlideOrigin ] = useState();

	const activateItem = ( itemId ) => {
		setItem( itemId );
		setActiveItem( itemId );
	};

	const activateLevel = ( levelId, slideInOrigin = 'left' ) => {
		setSlideOrigin( slideInOrigin );
		setLevel( levelId );
		setActiveLevel( levelId );
	};

	const isMounted = useRef( false );
	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
		}
	}, [] );

	useEffect( () => {
		if ( activeItem !== item ) {
			activateItem( activeItem );
		}
		if ( activeLevel !== level ) {
			activateLevel( activeLevel );
		}
	}, [ activeItem, activeLevel ] );

	const context = {
		activeItem: item,
		activeLevel: level,
		setActiveItem: activateItem,
		setActiveLevel: activateLevel,
	};

	return (
		<Root className="components-navigation">
			<Animate
				key={ level }
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
		</Root>
	);
}

export const NavigationLevel = ( {
	children: levelChildren,
	level = DEFAULT_LEVEL,
	parentLevel,
	parentLevelTitle,
	title,
} ) => {
	const { activeLevel, setActiveLevel } = useContext( NavigationContext );

	if ( activeLevel !== level ) {
		return null;
	}

	return (
		<div className="components-navigation__level">
			{ parentLevel ? (
				<BackButtonUI
					className="components-navigation__back-button"
					isTertiary
					onClick={ () => setActiveLevel( parentLevel, 'right' ) }
				>
					<Icon icon={ chevronLeft } />
					{ parentLevelTitle }
				</BackButtonUI>
			) : null }
			<MenuUI>
				<MenuTitleUI
					variant="subtitle"
					className="components-navigation__menu-title"
				>
					{ title }
				</MenuTitleUI>
				<ul>{ levelChildren }</ul>
			</MenuUI>
		</div>
	);
};

export const NavigationItem = ( {
	badge,
	children: itemChildren,
	href,
	item,
	navigateToLevel,
	onClick = noop,
	title,
	...props
} ) => {
	const { activeItem, setActiveItem, setActiveLevel } = useContext(
		NavigationContext
	);

	const classes = classnames( 'components-navigation__menu-item', {
		'is-active': item && activeItem === item,
	} );

	const onItemClick = () => {
		setActiveItem( item );

		if ( href ) {
			return onClick();
		}

		if ( navigateToLevel ) {
			setActiveLevel( navigateToLevel );
		}
		onClick();
	};

	return (
		<MenuItemUI className={ classes }>
			<Button href={ href } onClick={ onItemClick } { ...props }>
				{ title && (
					<MenuItemTitleUI
						className="components-navigation__menu-item-title"
						variant="body.small"
						as="span"
					>
						{ title }
					</MenuItemTitleUI>
				) }

				{ itemChildren }

				{ badge && (
					<BadgeUI className="components-navigation__menu-item-badge">
						{ badge }
					</BadgeUI>
				) }

				{ navigateToLevel && <Icon icon={ chevronRight } /> }
			</Button>
		</MenuItemUI>
	);
};
