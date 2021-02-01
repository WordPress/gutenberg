/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import useGrid from './use-grid';

/**
 * `Grid` is a primitive layout component that can arrange content in a grid configuration.
 *
 * @example
 * ```jsx
 * import { Grid } from `@wordpress/components/ui`
 *
 * function Example() {
 *   return (
 *     <Grid columns={3}>
 *       <View>
 *         One
 *       </View>
 *       <View>
 *         Two
 *       </View>
 *       <View>
 *         Three
 *       </View>
 *     </Grid>
 *   );
 * }
 * ```
 */
const Grid = createComponent( {
	as: 'div',
	useHook: useGrid,
	name: 'Grid',
} );

export default Grid;
