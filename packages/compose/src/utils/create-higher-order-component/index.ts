/**
 * External dependencies
 */
import { camelCase, upperFirst } from 'lodash';
// eslint-disable-next-line no-restricted-imports
import type { ComponentType } from 'react';
import type { Subtract } from 'utility-types';

/**
 * Higher order components can cause props to be obviated. For example a HOC that
 * injects i18n props will obviate the need for the i18n props to be passed to the component.
 *
 * If a HOC does not obviate the need for any specific props then we default to `{}` which
 * essentially subtracts 0 from the original props of the passed in component. An example
 * of this is the `pure` HOC which does not change the API surface of the component but
 * simply modifies the internals.
 */
export interface HigherOrderComponent< TObviatedProps extends object = {} > {
	< TP extends TObviatedProps >(
		OriginalComponent: ComponentType< TP >
	): ComponentType< Subtract< TP, TObviatedProps > >;
}

/**
 * Given a function mapping a component to an enhanced component and modifier
 * name, returns the enhanced component augmented with a generated displayName.
 *
 * @param mapComponentToEnhancedComponent Function mapping component to enhanced component.
 * @param modifierName                    Seed name from which to generated display name.
 *
 * @return Component class with generated display name assigned.
 */
function createHigherOrderComponent<
	TObviatedProps extends object,
	TProps extends TObviatedProps
>(
	mapComponentToEnhancedComponent: (
		OriginalComponent: ComponentType< TProps >
	) => ComponentType< Subtract< TProps, TObviatedProps > >,
	modifierName: string
): HigherOrderComponent< TObviatedProps > {
	return ( ( OriginalComponent: ComponentType< TProps > ) => {
		const EnhancedComponent = mapComponentToEnhancedComponent(
			OriginalComponent
		);

		const {
			displayName = OriginalComponent.name || 'Component',
		} = OriginalComponent;

		EnhancedComponent.displayName = `${ upperFirst(
			camelCase( modifierName )
		) }(${ displayName })`;

		return EnhancedComponent;
	} ) as HigherOrderComponent< TObviatedProps >;
}
export default createHigherOrderComponent;
