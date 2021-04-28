/**
 * Internal dependencies
 */
import { createComponent } from '../ui/utils';
import useText from './hook';

/**
 * `Text` is a core component that renders text in the library, using the
 * library's typography system.
 *
 * `Text` can be used to render any text-content, like an HTML `p` or `span`.
 *
 * @example
 *
 * ```jsx
 * import { Text } from `@wordpress/components`;
 *
 * function Example() {
 * 	return <Text>Code is Poetry</Text>;
 * }
 * ```
 */
const Text = createComponent( {
	as: 'span',
	useHook: useText,
	name: 'Text',
} );

export default Text;
