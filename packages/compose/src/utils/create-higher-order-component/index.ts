/**
 * External dependencies
 */
import { camelCase, upperFirst } from 'lodash';
import type { ComponentType } from 'react';

/**
 * Given a function mapping a component to an enhanced component and modifier
 * name, returns the enhanced component augmented with a generated displayName.
 *
 * @param  mapComponent Function mapping component to enhanced component.
 * @param  modifierName Seed name from which to generated display name.
 *
 * @return Component class with generated display name assigned.
 */
export function createHigherOrderComponent<
	HOC extends ( Inner: ComponentType< any > ) => ComponentType< any >
>( mapComponent: HOC, modifierName: string ): HOC {
	return ( ( Inner ) => {
		const Outer = mapComponent( Inner );
		Outer.displayName = hocName( modifierName, Inner );

		return Outer;
	} ) as HOC;
}

/**
 * Returns a displayName for a higher-order component, given a wrapper name.
 *
 * @example
 *     hocName( 'MyMemo', Widget ) === 'MyMemo(Widget)';
 *     hocName( 'MyMemo', <div /> ) === 'MyMemo(Component)';
 *
 * @param  name  Name assigned to higher-order component's wrapper component.
 * @param  Inner Wrapped component inside higher-order component.
 * @return       Wrapped name of higher-order component.
 */
const hocName = ( name: string, Inner: ComponentType< any > ): string => {
	const inner = Inner.displayName || Inner.name || 'Component';
	const outer = upperFirst( camelCase( name ) );

	return `${ outer }(${ inner })`;
};

export default createHigherOrderComponent;
