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
import { useSpacer } from './hook';
import type { SpacerProps } from './types';

function UnconnectedSpacer(
	props: WordPressComponentProps< SpacerProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const spacerProps = useSpacer( props );

	return <View { ...spacerProps } ref={ forwardedRef } />;
}

/**
 * `Spacer` is a primitive layout component that providers inner (`padding`) or outer (`margin`) space in-between components. It can also be used to adaptively provide space within an `HStack` or `VStack`.
 *
 * `Spacer` comes with a bunch of shorthand props to adjust `margin` and `padding`. The values of these props
 * can either be a number (which will act as a multiplier to the library's grid system base of 4px),
 * or a literal CSS value string.
 *
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
export const Spacer = contextConnect( UnconnectedSpacer, 'Spacer' );

export default Spacer;
