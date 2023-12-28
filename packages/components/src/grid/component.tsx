/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { contextConnect } from '../context';
import { View } from '../view';
import useGrid from './hook';
import type { GridProps } from './types';

function UnconnectedGrid(
	props: WordPressComponentProps< GridProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const gridProps = useGrid( props );

	return <View { ...gridProps } ref={ forwardedRef } />;
}

/**
 * `Grid` is a primitive layout component that can arrange content in a grid configuration.
 *
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
export const Grid = contextConnect( UnconnectedGrid, 'Grid' );

export default Grid;
