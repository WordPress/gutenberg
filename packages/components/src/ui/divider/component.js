/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useDivider } from './hook';

/**
 * `Divider` is a primitive layout component that separates content with lists and layouts.
 *
 * @example
 * ```jsx
 * import { Divider, View } from '@wordpress/components/ui';
 *
 * function Example() {
 * 	return (
 * 		<View>
 * 			<View>One</View>
 * 			<View>Two</View>
 * 			<View>Three</View>
 * 			<Divider />
 * 			<View>Four</View>
 * 			<View>Five</View>
 * 		</View>
 * 	);
}
 * ```
 */
const Divider = createComponent( {
	as: 'hr',
	useHook: useDivider,
	name: 'Divider',
} );

export default Divider;
