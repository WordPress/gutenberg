/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useSurface } from './hook';

/**
 * `Surface` is a core component that renders a primary background color.
 *
 * In the example below, notice how the `Surface` renders in white (or dark gray if in dark mode).
 *
 * ```jsx
 * import { Surface, Text } from `@wordpress/components/ui`;
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
export default createComponent( {
	as: 'div',
	useHook: useSurface,
	name: 'Surface',
} );
