/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, chevronLeft } from '@wordpress/icons';
import { useEffect, useMemo, useState, useRef } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Animate from '../animate';
import {
	BackButtonUI,
	MenuUI,
	MenuItemUI,
	Root,
} from './styles/navigation-styles';
import Button from '../button';

const Navigation = ( { activeItemId, children, data, rootTitle } ) => {
	const [ activeLevelId, setActiveLevelId ] = useState( 'root' );

	const appendItemData = ( item ) => {
		return {
			...item,
			children: [],
			parent: item.id === 'root' ? null : item.parent || 'root',
			isActive: item.id === activeItemId,
			setActiveLevelId,
		};
	};

	const mapItems = ( itemData ) => {
		const items = new Map(
			[
				{ id: 'root', parent: null, title: rootTitle },
				...itemData,
			].map( ( item ) => [ item.id, appendItemData( item ) ] )
		);

		items.forEach( ( item ) => {
			const parentItem = items.get( item.parent );
			if ( parentItem ) {
				parentItem.children.push( item );
				parentItem.hasChildren = true;
			}
		} );

		return items;
	};

	const items = useMemo( () => mapItems( data ), [
		data,
		activeItemId,
		rootTitle,
	] );
	const activeItem = items.get( activeItemId );
	const previousActiveLevelId = usePrevious( activeLevelId );
	const level = items.get( activeLevelId );
	const parentLevel = level && items.get( level.parent );
	const isNavigatingBack =
		previousActiveLevelId &&
		items.get( previousActiveLevelId ).parent === activeLevelId;

	useEffect( () => {
		if ( activeItem ) {
			setActiveLevelId( activeItem.parent );
		}
	}, [ activeItem ] );

	const isMounted = useRef( false );

	useEffect( () => {
		if ( ! isMounted.current ) {
			isMounted.current = true;
		}
	}, [] );

	const NavigationBackButton = ( { children: backButtonChildren } ) => {
		if ( ! parentLevel ) {
			return null;
		}

		return (
			<BackButtonUI
				className="components-navigation__back-button"
				isTertiary
				onClick={ () => setActiveLevelId( parentLevel.id ) }
			>
				<Icon icon={ chevronLeft } />
				{ backButtonChildren }
			</BackButtonUI>
		);
	};

	return (
		<Root className="components-navigation">
			<Animate
				key={ level.id }
				type="slide-in"
				options={ {
					origin: isNavigatingBack ? 'right' : 'left',
				} }
			>
				{ ( { className: animateClassName } ) => (
					<div
						className={ classnames(
							'components-navigation__level',
							{
								[ animateClassName ]: isMounted.current,
							}
						) }
					>
						{ children( {
							level,
							NavigationBackButton,
							parentLevel,
						} ) }
					</div>
				) }
			</Animate>
		</Root>
	);
};

export function Navigation2( { children } ) {
	const [ activeLevel, setActiveLevel ] = useState( 'root' );
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

	const NavigationBackButton = ( { parentLevel, label } ) => {
		return (
			<Button
				className="components-navigation__back-button"
				isPrimary
				onClick={ () => navigateBack( parentLevel ) }
			>
				{ label }
			</Button>
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
							NavigationBackButton,
						} ) }
					</div>
				) }
			</Animate>
		</Root>
	);
}

export function Navigation2Level( {
	children,
	slug,
	title,
	activeLevel,
	navigateBack,
} ) {
	if ( activeLevel !== slug ) {
		return null;
	}

	return (
		<div className="components-navigation__level">
			{ navigateBack }
			<h1>{ title }</h1>
			<MenuUI>{ children }</MenuUI>
		</div>
	);
}

export function Navigation2Item( { slug, title, onClick, activeItem } ) {
	const classes = classnames( 'components-navigation__menu-item', {
		'is-active': activeItem === slug,
	} );

	return (
		<MenuItemUI className={ classes }>
			<Button onClick={ onClick }>{ title }</Button>
		</MenuItemUI>
	);
}

export default Navigation;
export { default as NavigationMenu } from './menu';
export { default as NavigationMenuItem } from './menu-item';
