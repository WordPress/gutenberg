/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useVisuallyHidden } from './hook';

/**
 * `VisuallyHidden` is a component used to render text intended to be visually
 * hidden, but will show for alternate devices, for example a screen reader.
 *
 * @example
 * ```jsx
 * import { View, VisuallyHidden } from `@wordpress/components/ui`;
 *
 * function Example() {
 * 	return (
 * 		<VisuallyHidden>
 * 			<View as="label">Code is Poetry</View>
 * 		</VisuallyHidden>
 * 	);
 * }
 * ```
 */

const VisuallyHidden = createComponent( {
	as: 'div',
	useHook: useVisuallyHidden,
	name: 'VisuallyHidden',
} );

export default VisuallyHidden;
