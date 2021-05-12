/**
 * Internal dependencies
 */
import { createComponent } from '../ui/utils';
import { useVisuallyHidden } from './hook';

/**
 * `VisuallyHidden` is a component used to render text intended to be visually
 * hidden, but will show for alternate devices, for example a screen reader.
 *
 * @example
 * ```jsx
 * import { VisuallyHidden } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<VisuallyHidden>
 * 			<label>Code is Poetry</label>
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
