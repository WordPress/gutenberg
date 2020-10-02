/**
 * External dependencies
 */
import { camelCase, upperFirst } from 'lodash';

import type { ComponentType } from 'react';

interface MapComponentFunction< P, Q > {
	( OriginalComponent: ComponentType< P > ): ComponentType< Q >;
	name?: string;
	displayName?: string;
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
function createHigherOrderComponent< P = {}, Q = {} >(
	mapComponentToEnhancedComponent: MapComponentFunction< P, Q >,
	modifierName: string
) {
	return ( OriginalComponent: ComponentType< P > ): ComponentType< Q > => {
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
