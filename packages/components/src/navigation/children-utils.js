/**
 * External dependencies
 */
import { cloneDeep } from 'lodash';

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

	return items.reduce( ( acc, { child, parent } ) => {
		const key = child.props.item;

		acc[ key ] = cloneDeep( child.props );
		acc[ key ].menu = parent?.props?.menu ?? ROOT_MENU;
		delete acc[ key ].children;

		return acc;
	}, {} );
};

export const findNavigationMenus = ( children ) => {
	const menus = findChildrenWithClosestParent(
		children,
		( { type } ) => type === NavigationMenu
	);

	return menus.reduce( ( acc, { child } ) => {
		const key = child?.props?.menu ?? ROOT_MENU;

		acc[ key ] = cloneDeep( child.props );
		delete acc[ key ].children;

		return acc;
	}, {} );
};
