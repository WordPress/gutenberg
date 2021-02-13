/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import useTruncate from './use-truncate';

/**
 * `Truncate` is a typography primitive that trims text content. For almost all cases, it is recommended that `Text`, `Heading`, or `Subheading` is used to render text content. However, `Truncate` is available for custom implementations.
 *
 * @example
 * ```jsx
 * import { Truncate } from `@wp-g2/components`
 *
 * function Example() {
 *   return (
 *     <Truncate>
 *       Where the north wind meets the sea, there's a river full of memory. Sleep,
 *       my darling, safe and sound, for in this river all is found. In her waters,
 *       deep and true, lay the answers and a path for you. Dive down deep into her
 *       sound, but not too far or you'll be drowned
 *     </Truncate>
 *   );
 * }
 * ```
 */
const Truncate = createComponent( {
	as: 'span',
	useHook: useTruncate,
	name: 'Truncate',
} );

export default Truncate;
