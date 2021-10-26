/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import useGrid from './hook';

/**
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'div'>} props
 * @param {import('react').Ref<any>}                                                        forwardedRef
 */
function Grid( props, forwardedRef ) {
	const gridProps = useGrid( props );

	return <View { ...gridProps } ref={ forwardedRef } />;
}

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
const ConnectedGrid = contextConnect( Grid, 'Grid' );

export default ConnectedGrid;
