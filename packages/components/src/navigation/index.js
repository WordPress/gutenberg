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
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';

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
import Text from '../text';

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

export function Navigation2( { initialActiveLevel, children } ) {
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

	function Navigation2Level( {
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
					<Button
						className="components-navigation__back-button"
						isPrimary
						onClick={ () => navigateBack( parentLevel ) }
					>
						<Icon icon={ chevronLeft } />
						{ parentTite }
					</Button>
				) : null }
				<h1>{ title }</h1>
				<MenuUI>{ levelChildren }</MenuUI>
			</div>
		);
	}

	const Navigation2Category = ( { title, navigateTo: to } ) => {
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
							Navigation2Category,
							Navigation2Level,
						} ) }
					</div>
				) }
			</Animate>
		</Root>
	);
}

export function Navigation2Item( { slug, title, onClick, activeItem } ) {
	const classes = classnames( 'components-navigation__menu-item', {
		'is-active': activeItem === slug,
	} );

	return (
		<MenuItemUI className={ classes }>
			<Button onClick={ onClick }>
				<Text
					className="components-navigation__menu-item-title"
					variant="body.small"
					as="span"
				>
					{ title }
				</Text>
			</Button>
		</MenuItemUI>
	);
}

export default Navigation;
export { default as NavigationMenu } from './menu';
export { default as NavigationMenuItem } from './menu-item';
