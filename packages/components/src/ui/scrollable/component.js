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
 * import { Scrollable } from `@wordpress/components/ui`;
 
 * function Example() {
 * 	return (
 * 		<Scrollable style={ { maxHeight: 200 } }>
 * 			<div style={ { height: 500 } }>...</div>
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
