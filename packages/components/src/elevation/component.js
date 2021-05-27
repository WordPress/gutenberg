/**
 * Internal dependencies
 */
import { useElevation } from './hook';
import { createComponent } from '../ui/utils';

/**
 * `Elevation` is a core component that renders shadow, using the library's shadow system.
 *
 * The shadow effect is generated using the `value` prop.
 *
 * @example
 * ```jsx
 * import { Elevation, Surface, Text, View } from `@wordpress/components`;
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
const Elevation = createComponent( {
	as: 'div',
	useHook: useElevation,
	name: 'Elevation',
} );

export default Elevation;
