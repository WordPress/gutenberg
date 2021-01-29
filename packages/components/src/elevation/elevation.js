/**
 * External dependencies
 */
import { contextConnect } from '@wp-g2/context';

/**
 * Internal dependencies
 */
import View from '../view';
import { useElevation } from './use-elevation';

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<'div', import('./types').Props>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function Elevation( props, forwardedRef ) {
	const otherProps = useElevation( props );

	return <View aria-hidden { ...otherProps } ref={ forwardedRef } />;
}

/**
 * `Elevation` is a core component that renders shadow, using the library's shadow system.
 *
 * The shadow effect is generated using the `value` prop.
 *
 * @example
 * ```jsx
 * import { Elevation, Surface, Text, View } from `@wp-g2/components`
 * import { ui } from `@wp-g2/styles`
 *
 * function Example() {
 *   return (
 *     <View css={[ui.padding(5)]}>
 *       <Surface css={[ui.padding(5)]}>
 *         <Text>Into The Unknown</Text>
 *         <Elevation value={5} />
 *       </Surface>
 *     </View>
 *   );
 * }
 * ```
 */
const ConnectedElevation = contextConnect( Elevation, 'Elevation' );

export default ConnectedElevation;
