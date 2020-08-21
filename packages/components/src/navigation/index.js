/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Animate from '../animate';
import { Root } from './styles/navigation-styles';
import Button from '../button';

const Navigation = ( { activeItemId, children, data, rootTitle } ) => {
	const [ activeLevel, setActiveLevel ] = useState( 'root' );

	const mapItemData = ( items ) => {
		return items.map( ( item ) => {
			const itemChildren = data.filter( ( i ) => i.parent === item.id );
			return {
				...item,
				children: itemChildren,
				parent: item.parent || 'root',
				isActive: item.id === activeItemId,
				hasChildren: itemChildren.length > 0,
				setActiveLevel,
			};
		} );
	};

	const getRootItem = ( items ) => {
		const itemChildren = items.filter( ( i ) => i.parent === 'root' );
		return {
			id: 'root',
			parent: null,
			title: rootTitle,
			children: itemChildren,
			isActive: false,
			hasChildren: itemChildren.length > 0,
		};
	};

	const mappedItems = mapItemData( data );
	const items = [ getRootItem( mappedItems ), ...mappedItems ];
	const levels = items.filter( ( item ) => item.hasChildren );
	const activeItem = items.find( ( item ) => item.id === activeItemId );

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
			{ levels.map(
				( level ) =>
					activeLevel === level.id && (
						<Animate type="slide-in" key={ level.id }>
							{ ( { className: animateClassName } ) => (
								<div
									className={ classnames(
										'components-navigation__level',
										animateClassName
									) }
								>
									{ children( {
										level,
										levelItems: items.filter(
											( i ) => i.parent === level.id
										),
										NavigationBackButton,
										parentLevel: items.find(
											( i ) => i.id === level.parent
										),
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
