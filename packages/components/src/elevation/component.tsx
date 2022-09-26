/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../ui/context';
import { View } from '../view';
import { useElevation } from './hook';
import type { ElevationProps } from './types';

function UnconnectedElevation(
	props: WordPressComponentProps< ElevationProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const elevationProps = useElevation( props );

	return <View { ...elevationProps } ref={ forwardedRef } />;
}

/**
 * `Elevation` is a core component that renders shadow, using the component
 * system's shadow system.
 *
 * The shadow effect is generated using the `value` prop.
 *
 * ```jsx
 * import {
 *	__experimentalElevation as Elevation,
 *	__experimentalSurface as Surface,
 *	__experimentalText as Text,
 * } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <Surface>
 *       <Text>Code is Poetry</Text>
 *       <Elevation value={ 5 } />
 *     </Surface>
 *   );
 * }
 * ```
 */
export const Elevation = contextConnect( UnconnectedElevation, 'Elevation' );

export default Elevation;
