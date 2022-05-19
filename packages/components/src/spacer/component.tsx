/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../ui/context';
import { View } from '../view';
import { useSpacer } from './hook';
import type { Props } from './types';

function Spacer(
	props: WordPressComponentProps< Props, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const spacerProps = useSpacer( props );

	return <View { ...spacerProps } ref={ forwardedRef } />;
}

/**
 * `Spacer` is a primitive layout component that providers inner (`padding`) or outer (`margin`) space in-between components. It can also be used to adaptively provide space within an `HStack` or `VStack`.
 *
 * `Spacer` comes with a bunch of shorthand props to adjust `margin` and `padding`. The values of these props work as a multiplier to the library's grid system (base of `4px`).
 *
 * @example
 * ```jsx
 * import { Spacer } from `@wordpress/components`
 *
 * function Example() {
 *   return (
 *     <View>
 *       <Spacer>
 *         <Heading>WordPress.org</Heading>
 *       </Spacer>
 *       <Text>
 *         Code is Poetry
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 */
const ConnectedSpacer = contextConnect( Spacer, 'Spacer' );

export default ConnectedSpacer;
