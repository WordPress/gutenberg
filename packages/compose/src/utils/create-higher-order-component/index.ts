/**
 * External dependencies
 */
import { camelCase, upperFirst } from 'lodash';
import type { ComponentType } from 'react';

export type PropsOf< C extends ComponentType< any > > = C extends ComponentType<
	infer Props
>
	? Props
	: never;

/**
 * Given a function mapping a component to an enhanced component and modifier
 * name, returns the enhanced component augmented with a generated displayName.
 *
 * @param  mapComponent Function mapping component to enhanced component.
 * @param  modifierName Seed name from which to generated display name.
 *
 * @return Component class with generated display name assigned.
 */
export function createHigherOrderComponent(
	mapComponent: ( Inner: ComponentType< any > ) => ComponentType< any >,
	modifierName: string
): typeof mapComponent {
	return ( Inner: Parameters< typeof mapComponent >[ 0 ] ) => {
		const Outer = mapComponent( Inner );
		const displayName = Inner.displayName || Inner.name || 'Component';
		Outer.displayName = `${ upperFirst(
			camelCase( modifierName )
		) }(${ displayName })`;
		return Outer;
	};
}

export default createHigherOrderComponent;
