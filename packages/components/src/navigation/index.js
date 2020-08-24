/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Animate from '../animate';
import { Root } from './styles/navigation-styles';
import Button from '../button';

const Navigation = ( { activeItemId, children, data, rootTitle } ) => {
	const [ activeLevel, setActiveLevel ] = useState( 'root' );

	const appendItemData = ( item ) => {
		return {
			...item,
			children: [],
			parent: item.id === 'root' ? null : item.parent || 'root',
			isActive: item.id === activeItemId,
			setActiveLevel,
		};
	};

	const getLevels = ( mappedItems ) => {
		const levels = new Set();

		mappedItems.forEach( ( item ) => {
			const parentItem = mappedItems.get( item.parent );
			if ( parentItem ) {
				parentItem.children.push( item );
				parentItem.hasChildren = true;
				levels.add( parentItem );
			}
		} );

		return levels;
	};

	const items = new Map(
		[
			{ id: 'root', parent: null, title: rootTitle },
			...data,
		].map( ( item ) => [ item.id, appendItemData( item ) ] )
	);

	const levels = getLevels( items );
	const parentLevel = items.get( level.parent );
	const activeItem = items.get( activeItemId );
	const previousActiveLevel = usePrevious( activeLevel );
	const isNavigatingBack =
		previousActiveLevel &&
		items.get( previousActiveLevel ).parent === activeLevel;

	useEffect( () => {
		if ( activeItem ) {
			setActiveLevel( activeItem.parent );
		}
	}, [] );

	const NavigationBackButton = ( { children: backButtonChildren } ) => {
		if ( ! parentLevel ) {
			return null;
		}

		return (
			<Button
				isPrimary
				onClick={ () => setActiveLevel( parentLevel.id ) }
			>
				{ backButtonChildren }
			</Button>
		);
	};

	return (
		<Root className="components-navigation">
			{ Array.from( levels ).map(
				( level ) =>
					activeLevel === level.id && (
						<Animate
							type="slide-in"
							options={ {
								origin: isNavigatingBack ? 'right' : 'left',
							} }
							key={ level.id }
						>
							{ ( { className: animateClassName } ) => (
								<div
									className={ classnames(
										'components-navigation__level',
										animateClassName
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
					)
			) }
		</Root>
	);
};

export default Navigation;
export { default as NavigationMenu } from './menu';
export { default as NavigationMenuItem } from './menu-item';
