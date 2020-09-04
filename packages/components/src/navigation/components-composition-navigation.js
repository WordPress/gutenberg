/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
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

export default function ComponentsCompositionNavigation( {
	children,
	initialActiveItem,
	initialActiveLevel,
} ) {
	const [ activeLevel, setActiveLevel ] = useState( initialActiveLevel );
	const [ activeItem, setActiveItem ] = useState( initialActiveItem );
	const [ slideOrigin, setSlideOrigin ] = useState();

	const isMounted = useRef( false );
	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
		}
	}, [] );

	const setLevel = ( level, slideInOrigin = 'left' ) => {
		setActiveLevel( level );
		setSlideOrigin( slideInOrigin );
	};

	const NavigationLevel = ( {
		children: levelChildren,
		level,
		parentLevel,
		parentTitle,
		title,
	} ) => {
		if ( activeLevel !== level ) {
			return null;
		}

		return (
			<div className="components-navigation__level">
				{ parentLevel ? (
					<BackButtonUI
						className="components-navigation__back-button"
						isTertiary
						onClick={ () => setLevel( parentLevel, 'right' ) }
					>
						<Icon icon={ chevronLeft } />
						{ parentTitle }
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

	const NavigationItem = ( {
		badge,
		children: itemChildren,
		href,
		navigateToLevel,
		onClick,
		slug,
		title,
	} ) => {
		const classes = classnames( 'components-navigation__menu-item', {
			'is-active': slug && activeItem === slug,
		} );

		const onItemClick = () => {
			if ( href ) {
				return onClick();
			}

			setActiveItem( 'slug' );
			if ( navigateToLevel ) {
				setLevel( navigateToLevel );
			}
			onClick();
		};

		return (
			<MenuItemUI className={ classes }>
				<Button href={ href } onClick={ onItemClick }>
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

	return (
		<Root className="components-navigation">
			<Animate
				key={ activeLevel }
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
						{ children( {
							NavigationItem,
							NavigationLevel,
						} ) }
					</div>
				) }
			</Animate>
		</Root>
	);
}
