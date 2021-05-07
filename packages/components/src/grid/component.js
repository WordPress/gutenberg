/**
 * Internal dependencies
 */
import { createComponent } from '../ui/utils';
import useGrid from './hook';

/**
 * `Grid` is a primitive layout component that can arrange content in a grid configuration.
 *
 * @example
 * ```jsx
 * import { __experimentalGrid as Grid, __experimentalView as View } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<Grid columns={ 3 }>
 * 			<View>Code</View>
 * 			<View>is</View>
 * 			<View>Poetry</View>
 * 		</Grid>
 * 	);
 * }
 * ```
 */
const Grid = createComponent( {
	as: 'div',
	useHook: useGrid,
	name: 'Grid',
} );

export default Grid;
