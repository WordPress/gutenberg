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
	MenuItemTitleUI,
	MenuItemUI,
	MenuTitleUI,
	MenuUI,
	Root,
} from './styles/navigation-styles';
import Button from '../button';

export default function ComponentsCompositionNavigation( {
	initialActiveLevel,
	children,
} ) {
	const [ activeLevel, setActiveLevel ] = useState( initialActiveLevel );
	const [ slideOrigin, setSlideOrigin ] = useState( 'left' );

	const isMounted = useRef( false );
	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
		}
	}, [] );

	const navigateTo = ( level ) => {
		setActiveLevel( level );
		setSlideOrigin( 'left' );
	};

	const navigateBack = ( level ) => {
		setActiveLevel( level );
		setSlideOrigin( 'right' );
	};

	function NavigationLevel( {
		children: levelChildren,
		slug,
		title,
		parentLevel,
		parentTite,
	} ) {
		if ( activeLevel !== slug ) {
			return null;
		}

		return (
			<div className="components-navigation__level">
				{ parentLevel ? (
					<BackButtonUI
						className="components-navigation__back-button"
						isTertiary
						onClick={ () => navigateBack( parentLevel ) }
					>
						<Icon icon={ chevronLeft } />
						{ parentTite }
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
	}

	const NavigationCategory = ( { title, navigateTo: to } ) => {
		return (
			<MenuItemUI className="components-navigation__menu-item">
				<Button onClick={ () => navigateTo( to ) }>
					{ title }
					<Icon icon={ chevronRight } />
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
							[ animateClassName ]: isMounted.current,
						} ) }
					>
						{ children( {
							activeLevel,
							navigateTo,
							NavigationCategory,
							NavigationLevel,
						} ) }
					</div>
				) }
			</Animate>
		</Root>
	);
}

export function NavigationItem( { slug, title, onClick, activeItem } ) {
	const classes = classnames( 'components-navigation__menu-item', {
		'is-active': activeItem === slug,
	} );

	return (
		<MenuItemUI className={ classes }>
			<Button onClick={ onClick }>
				<MenuItemTitleUI
					className="components-navigation__menu-item-title"
					variant="body.small"
					as="span"
				>
					{ title }
				</MenuItemTitleUI>
			</Button>
		</MenuItemUI>
	);
}
