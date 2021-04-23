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
export interface HigherOrderComponent< TRemovedProps extends object = {} > {
	< TP extends TRemovedProps >(
		OriginalComponent: ComponentType< TP >
	): ComponentType< Subtract< TP, TRemovedProps > >;
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
	TRemovedProps extends object,
	TProps extends TRemovedProps
>(
	mapComponentToEnhancedComponent: (
		OriginalComponent: ComponentType< TProps >
	) => ComponentType< Subtract< TProps, TRemovedProps > >,
	modifierName: string
): HigherOrderComponent< TRemovedProps > {
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
	} ) as HigherOrderComponent< TRemovedProps >;
}
export default createHigherOrderComponent;
