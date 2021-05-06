/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useScrollable } from './hook';

/**
 * `Scrollable` is a layout component that content in a scrollable container.
 *
 * @example
 * ```jsx
 * import { Scrollable, View } from `@wordpress/components/ui`;
 
 * function Example() {
 * 	return (
 * 		<Scrollable style={ { maxHeight: 200 } }>
 * 			<View style={ { height: 500 } }>...</View>
 * 		</Scrollable>
 * 	);
 * }
 * ```
 */

const Scrollable = createComponent( {
	as: 'div',
	useHook: useScrollable,
	name: 'Scrollable',
} );

export default Scrollable;
