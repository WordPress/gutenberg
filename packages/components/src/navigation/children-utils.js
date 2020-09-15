/**
 * External dependencies
 */
import { keyBy, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ROOT_MENU } from './constants';
import NavigationItem from './item';
import NavigationMenu from './menu';

/**
 *
 * @typedef {Object} ChildWithClosestParent
 * @property {WPElement} child element that matched the predicate
 * @property {WPElement?} parent closest matching parent that matched the parentPredicate
 */

/**
 *
 * @param {WPElement} initialChildren children to iterate through recursively
 * @param {Function} predicate children matching this function predicate will be returned
 * @param {Function} parentPredicate closest parent will be determined by this function predicate
 *
 * @return {ChildWithClosestParent[]} children with their closest parent
 */
export const findChildrenWithClosestParent = (
	initialChildren,
	predicate,
	parentPredicate
) => {
	const hasPredicate = typeof predicate === 'function';
	const hasParentPredicate = typeof parentPredicate === 'function';

	const innerRecursion = ( children, lastParent ) => {
		let items = [];

		Children.forEach( children, ( child ) => {
			const predicateOk = hasPredicate && predicate( child );
			if ( predicateOk ) {
				items.push( { child, parent: lastParent } );
			}

			const hasChildren = child?.props?.children;
			if ( hasChildren ) {
				const parentPredicateOk =
					hasParentPredicate && parentPredicate( child );
				if ( parentPredicateOk ) {
					lastParent = child;
				}

				items = items.concat(
					findChildrenWithClosestParent(
						child.props.children,
						predicate,
						parentPredicate,
						lastParent
					)
				);
			}
		} );

		return items;
	};

	return innerRecursion( initialChildren, null );
};

export const findNavigationItems = ( children ) => {
	const items = findChildrenWithClosestParent(
		children,
		( { type } ) => type === NavigationItem
	);

	const itemsWithMenu = items.map( ( { child, parent } ) => ( {
		...child,
		props: { ...child.props, menu: parent?.props?.menu ?? ROOT_MENU },
	} ) );

	const itemsWithoutChildren = itemsWithMenu.map( ( { props } ) =>
		omit( props, 'children' )
	);
	const itemsByItemProp = keyBy( itemsWithoutChildren, 'item' );

	return itemsByItemProp;
};

export const findNavigationMenus = ( children ) => {
	const menus = findChildrenWithClosestParent(
		children,
		( { type } ) => type === NavigationMenu
	).map( ( { child } ) => child );

	const menusWithoutChildren = menus.map( ( { props } ) =>
		omit( props, 'children' )
	);
	const menusByMenuProp = keyBy( menusWithoutChildren, 'menu' );

	return menusByMenuProp;
};
