/**
 * Internal dependencies
 */
import { useElevation } from './use-elevation';
import { createComponent } from '../utils';

/**
 * `Elevation` is a core component that renders shadow, using the library's shadow system.
 *
 * The shadow effect is generated using the `value` prop.
 *
 * @example
 * ```jsx
 * function Example() {
 *   return (
 *     <View css={ [ ui.padding( 5 ) ] }>
 *       <Surface css={ [ ui.padding( 5 ) ] }>
 *         <Text>Into The Unknown</Text>
 *         <Elevation value={ 5 } />
 *       </Surface>
 *     </View>
 *   );
 * }
 * ```
 */
const Elevation = createComponent( {
	as: 'div',
	useHook: useElevation,
	name: 'Elevation',
} );

export default Elevation;
