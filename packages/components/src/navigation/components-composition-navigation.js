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
	initialActiveItem,
	initialActiveLevel = DEFAULT_LEVEL,
	setInitialActiveItem = noop,
	setInitialActiveLevel = noop,
} ) {
	const [ item, setItem ] = useState( initialActiveItem );
	const [ level, setLevel ] = useState( initialActiveLevel );
	const [ slideOrigin, setSlideOrigin ] = useState();

	const setActiveLevel = ( levelId, slideInOrigin = 'left' ) => {
		setSlideOrigin( slideInOrigin );
		setLevel( levelId );
		setInitialActiveLevel( levelId );
	};

	const setActiveItem = ( itemId ) => {
		setItem( itemId );
		setInitialActiveItem( itemId );
	};

	const isMounted = useRef( false );
	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
		}
	}, [] );

	useEffect( () => {
		if ( initialActiveItem !== item ) {
			setActiveItem( initialActiveItem );
		}
		if ( initialActiveLevel !== level ) {
			setActiveLevel( initialActiveLevel );
		}
	}, [ initialActiveItem, initialActiveLevel ] );

	const context = {
		activeItem: item,
		activeLevel: level,
		setActiveItem,
		setActiveLevel,
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
	levelId = DEFAULT_LEVEL,
	parentLevelId,
	parentLevelTitle,
	title,
} ) => {
	const { activeLevel, setActiveLevel } = useContext( NavigationContext );

	if ( activeLevel !== levelId ) {
		return null;
	}

	return (
		<div className="components-navigation__level">
			{ parentLevelId ? (
				<BackButtonUI
					className="components-navigation__back-button"
					isTertiary
					onClick={ () => setActiveLevel( parentLevelId, 'right' ) }
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
	itemId,
	navigateToLevel,
	onClick = noop,
	title,
	...props
} ) => {
	const { activeItem, setActiveItem, setActiveLevel } = useContext(
		NavigationContext
	);

	const classes = classnames( 'components-navigation__menu-item', {
		'is-active': itemId && activeItem === itemId,
	} );

	const onItemClick = () => {
		if ( href ) {
			return onClick();
		}

		setActiveItem( itemId );
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
