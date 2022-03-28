/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import { useSurface } from './hook';

/**
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                               forwardedRef
 */
function Surface( props, forwardedRef ) {
	const surfaceProps = useSurface( props );

	return <View { ...surfaceProps } ref={ forwardedRef } />;
}

/**
 * `Surface` is a core component that renders a primary background color.
 *
 * In the example below, notice how the `Surface` renders in white (or dark gray if in dark mode).
 *
 * ```jsx
 * import {
 *	__experimentalSurface as Surface,
 *	__experimentalText as Text,
 * } from '@wordpress/components';
 *
 * function Example() {
 * 	return (
 * 		<Surface>
 * 			<Text>Code is Poetry</Text>
 * 		</Surface>
 * 	);
 * }
 * ```
 */
const ConnectedSurface = contextConnect( Surface, 'Surface' );

export default ConnectedSurface;
