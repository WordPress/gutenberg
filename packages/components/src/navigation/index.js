/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState, useRef } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Animate from '../animate';
import { Root } from './styles/navigation-styles';
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

	const isMounted = useRef( true );

	useEffect( () => {
		if ( isMounted.current ) {
			isMounted.current = false;
		}
	}, [] );

	const NavigationBackButton = ( { children: backButtonChildren } ) => {
		if ( ! parentLevel ) {
			return null;
		}

		return (
			<Button
				className="components-navigation__back-button"
				isPrimary
				onClick={ () => setActiveLevelId( parentLevel.id ) }
			>
				{ backButtonChildren }
			</Button>
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
								[ animateClassName ]: ! isMounted.current,
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

export default Navigation;
export { default as NavigationMenu } from './menu';
export { default as NavigationMenuItem } from './menu-item';
