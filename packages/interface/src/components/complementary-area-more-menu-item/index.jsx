import { observableMap, useObservableValue } from '@wordpress/compose';
import { useLayoutEffect } from '@wordpress/element';
import ComplementaryAreaToggle from '../complementary-area-toggle';
import ActionItem from '../action-item';

// How many more menu items are rendered for a complementary area, by
// `scope/target`.
const menuItems = observableMap();

export function useHasComplementaryAreaMenuItem( scope, target ) {
	return !! useObservableValue( menuItems, `${ scope }/${ target }` );
}

// The more menu item `ComplementaryArea` injects for every pinnable area. It is
// left out while a plugin renders one of its own for the same area.
// @see https://github.com/WordPress/gutenberg/issues/14457
export function DefaultComplementaryAreaMoreMenuItem( {
	scope,
	target,
	...props
} ) {
	return (
		<ComplementaryAreaToggle
			as={ ( toggleProps ) => (
				<ActionItem
					name={ `${ scope }/plugin-more-menu` }
					{ ...toggleProps }
				/>
			) }
			role="menuitemcheckbox"
			name={ target }
			scope={ scope }
			{ ...props }
		/>
	);
}

export default function ComplementaryAreaMoreMenuItem( {
	scope,
	target,
	// Accepted so they don't leak to DOM elements. Registering the menu item is
	// what keeps `ComplementaryArea` from injecting a second one.
	__unstableExplicitMenuItem,
	__unstableTarget,
	...props
} ) {
	useLayoutEffect( () => {
		const key = `${ scope }/${ target }`;
		menuItems.set( key, ( menuItems.get( key ) ?? 0 ) + 1 );

		return () => {
			const count = menuItems.get( key ) - 1;
			if ( count ) {
				menuItems.set( key, count );
			} else {
				menuItems.delete( key );
			}
		};
	}, [ scope, target ] );

	return (
		<DefaultComplementaryAreaMoreMenuItem
			scope={ scope }
			target={ target }
			{ ...props }
		/>
	);
}
