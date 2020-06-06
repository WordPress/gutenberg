/**
 * External dependencies
 */
import { camelCase, upperFirst } from 'lodash';

/**
 * Given a function mapping a component to an enhanced component and modifier
 * name, returns the enhanced component augmented with a generated displayName.
 *
 * @template OriginalProps
 * @template InjectedProps
 * @param {import('../../types').MapComponentFunction<OriginalProps, InjectedProps>} mapComponentToEnhancedComponent Function mapping component
 *                                                   to enhanced component.
 * @param {string}   modifierName                    Seed name from which to
 *                                                   generated display name.
 *
 * @return {import('../../types').MapComponentFunction<OriginalProps, InjectedProps>} Component class with generated display name assigned.
 */
function createHigherOrderComponent(
	mapComponentToEnhancedComponent,
	modifierName
) {
	return ( OriginalComponent ) => {
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
	};
}

export default createHigherOrderComponent;
