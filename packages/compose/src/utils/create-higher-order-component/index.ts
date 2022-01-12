/**
 * External dependencies
 */
import { camelCase, upperFirst } from 'lodash';
import type { ComponentType } from 'react';

/**
 * Higher order components can cause props to be obviated. For example a HOC that
 * injects i18n props will obviate the need for the i18n props to be passed to the component.
 *
 * If a HOC does not obviate the need for any specific props then we default to `{}` which
 * essentially subtracts 0 from the original props of the passed in component. An example
 * of this is the `pure` HOC which does not change the API surface of the component but
 * simply modifies the internals.
 */
export type HigherOrderComponent< HOCProps extends Record< string, any > > = <
	InnerProps extends HOCProps
>(
	Inner: ComponentType< InnerProps >
) => {} extends HOCProps
	? ComponentType< InnerProps >
	: ComponentType< Omit< InnerProps, keyof HOCProps > >;

/**
 * Given a function mapping a component to an enhanced component and modifier
 * name, returns the enhanced component augmented with a generated displayName.
 *
 * @param mapComponent Function mapping component to enhanced component.
 * @param modifierName Seed name from which to generated display name.
 *
 * @return {ComponentType} Component class with generated display name assigned.
 */
function createHigherOrderComponent<
	HOCProps extends Record< string, any > = {}
>( mapComponent: HigherOrderComponent< HOCProps >, modifierName: string ) {
	return < InnerProps extends HOCProps >(
		Inner: ComponentType< InnerProps >
	) => {
		const Outer = mapComponent( Inner );
		const displayName = Inner.displayName || Inner.name || 'Component';
		Outer.displayName = `${ upperFirst(
			camelCase( modifierName )
		) }(${ displayName })`;
		return Outer;
	};
}

export default createHigherOrderComponent;
