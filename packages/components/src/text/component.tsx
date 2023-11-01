/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { contextConnect } from '../context';
import { View } from '../view';
import useText from './hook';
import type { Props } from './types';

/**
 * @param props
 * @param forwardedRef
 */
function UnconnectedText(
	props: WordPressComponentProps< Props, 'span' >,
	forwardedRef: React.ForwardedRef< any >
) {
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
export const Text = contextConnect( UnconnectedText, 'Text' );
export default Text;
