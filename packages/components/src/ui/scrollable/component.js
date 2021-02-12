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
 * <Scrollable><View>...</View></Scrollable>
 * ```
 */
const Scrollable = createComponent( {
	as: 'div',
	useHook: useScrollable,
	name: 'Scrollable',
} );

export default Scrollable;
