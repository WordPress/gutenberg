/**
 * External dependencies
 */
import { pascalCase } from 'change-case';
import type { ComponentType } from 'react';

type GetProps< C > = C extends ComponentType< infer P > ? P : never;

export type WithoutInjectedProps< C, I > = Omit< GetProps< C >, keyof I >;

export type WithInjectedProps< C, I > = ComponentType<
	WithoutInjectedProps< C, I > & I
>;

/**
 * Given a function mapping a component to an enhanced component and modifier
 * name, returns the enhanced component augmented with a generated displayName.
 *
 * @param mapComponent Function mapping component to enhanced component.
 * @param modifierName Seed name from which to generated display name.
 *
 * @return Component class with generated display name assigned.
 */
export function createHigherOrderComponent<
	TInner extends ComponentType< any >,
	TOuter extends ComponentType< any >,
>( mapComponent: ( Inner: TInner ) => TOuter, modifierName: string ) {
	return ( Inner: TInner ) => {
		const Outer = mapComponent( Inner );
		Outer.displayName = hocName( modifierName, Inner );
		return Outer;
	};
}

/**
 * Returns a displayName for a higher-order component, given a wrapper name.
 *
 * @example
 *     hocName( 'MyMemo', Widget ) === 'MyMemo(Widget)';
 *     hocName( 'MyMemo', <div /> ) === 'MyMemo(Component)';
 *
 * @param name  Name assigned to higher-order component's wrapper component.
 * @param Inner Wrapped component inside higher-order component.
 * @return       Wrapped name of higher-order component.
 */
const hocName = ( name: string, Inner: ComponentType< any > ) => {
	const inner = Inner.displayName || Inner.name || 'Component';
	const outer = pascalCase( name ?? '' );

	return `${ outer }(${ inner })`;
};
