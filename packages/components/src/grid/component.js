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
 * import {
 * 	__experimentalGrid as Grid,
 * 	__experimentalText as Text
 * } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<Grid columns={ 3 }>
 * 			<Text>Code</Text>
 * 			<Text>is</Text>
 * 			<Text>Poetry</Text>
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
