/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import useTruncate from './hook';

/**
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'span'>} props
 * @param {import('react').Ref<any>}                                                         forwardedRef
 */
function Truncate( props, forwardedRef ) {
	const truncateProps = useTruncate( props );

	return <View as="span" { ...truncateProps } ref={ forwardedRef } />;
}

/**
 * `Truncate` is a typography primitive that trims text content.
 * For almost all cases, it is recommended that `Text`, `Heading`, or
 * `Subheading` is used to render text content. However,`Truncate` is
 * available for custom implementations.
 *
 * @example
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
const ConnectedTruncate = contextConnect( Truncate, 'Truncate' );

export default ConnectedTruncate;
