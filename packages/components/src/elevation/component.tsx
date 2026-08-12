import type { ForwardedRef } from 'react';
import type { WordPressComponentProps } from '../context';
import { contextConnect } from '../context';
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
 *	__experimentalText as Text,
 * } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <div>
 *       <Text>Code is Poetry</Text>
 *       <Elevation value={ 5 } />
 *     </div>
 *   );
 * }
 * ```
 */
export const Elevation = contextConnect( UnconnectedElevation, 'Elevation' );

export default Elevation;
