/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import useText from './hook';

/**
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'span'>} props
 * @param {import('react').Ref<any>}                                                         forwardedRef
 */
function Text( props, forwardedRef ) {
	const textProps = useText( props );

	return <View as="span" { ...textProps } ref={ forwardedRef } />;
}

/**
 * `Text` is a core component that renders text in the library, using the
 * library's typography system.
 *
 * `Text` can be used to render any text-content, like an HTML `p` or `span`.
 *
 * @example
 *
 * ```jsx
 * import { __experimentalText as Text } from `@wordpress/components`;
 *
 * function Example() {
 * 	return <Text>Code is Poetry</Text>;
 * }
 * ```
 */
const ConnectedText = contextConnect( Text, 'Text' );

export default ConnectedText;
