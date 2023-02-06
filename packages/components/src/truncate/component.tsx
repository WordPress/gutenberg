/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../ui/context';
import { View } from '../view';
import useTruncate from './hook';
import type { TruncateProps } from './types';

function UnconnectedTruncate(
	props: WordPressComponentProps< TruncateProps, 'span' >,
	forwardedRef: ForwardedRef< any >
) {
	const truncateProps = useTruncate( props );

	return <View as="span" { ...truncateProps } ref={ forwardedRef } />;
}

/**
 * `Truncate` is a typography primitive that trims text content.
 * For almost all cases, it is recommended that `Text`, `Heading`, or
 * `Subheading` is used to render text content. However,`Truncate` is
 * available for custom implementations.
 *
 * ```jsx
 * import { __experimentalTruncate as Truncate } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<Truncate>
 * 			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc ex
 * 			neque, vulputate a diam et, luctus convallis lacus. Vestibulum ac
 * 			mollis mi. Morbi id elementum massa.
 * 		</Truncate>
 * 	);
 * }
 * ```
 */
export const Truncate = contextConnect( UnconnectedTruncate, 'Truncate' );

export default Truncate;
