/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import { useElevation } from './hook';

/**
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                               forwardedRef
 */
function Elevation( props, forwardedRef ) {
	const elevationProps = useElevation( props );

	return <View { ...elevationProps } ref={ forwardedRef } />;
}

/**
 * `Elevation` is a core component that renders shadow, using the library's shadow system.
 *
 * The shadow effect is generated using the `value` prop.
 *
 * @example
 * ```jsx
 * import {
 *	__experimentalElevation as Elevation,
 *	__experimentalSurface as Surface,
 *	__experimentalText as Text,
 * } from '@wordpress/components';
 *
 * function Example() {
 * 	return (
 * 		<Surface>
 * 			<Text>Code is Poetry</Text>
 * 			<Elevation value={ 5 } />
 * 		</Surface>
 * 	);
 * }
 * ```
 */
const ConnectedElevation = contextConnect( Elevation, 'Elevation' );

export default ConnectedElevation;
