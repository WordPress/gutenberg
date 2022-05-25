/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import { useScrollable } from './hook';

/**
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                               forwardedRef
 */
function Scrollable( props, forwardedRef ) {
	const scrollableProps = useScrollable( props );

	return <View { ...scrollableProps } ref={ forwardedRef } />;
}

/**
 * `Scrollable` is a layout component that content in a scrollable container.
 *
 * @example
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

const ConnectedScrollable = contextConnect( Scrollable, 'Scrollable' );

export default ConnectedScrollable;
