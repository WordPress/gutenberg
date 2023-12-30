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
import { useScrollable } from './hook';
import type { ScrollableProps } from './types';

function UnconnectedScrollable(
	props: WordPressComponentProps< ScrollableProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const scrollableProps = useScrollable( props );

	return <View { ...scrollableProps } ref={ forwardedRef } />;
}

/**
 * `Scrollable` is a layout component that content in a scrollable container.
 *
 * ```jsx
 * import { __experimentalScrollable as Scrollable } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<Scrollable style={ { maxHeight: 200 } }>
 * 			<div style={ { height: 500 } }>...</div>
 * 		</Scrollable>
 * 	);
 * }
 * ```
 */
export const Scrollable = contextConnect( UnconnectedScrollable, 'Scrollable' );

export default Scrollable;
