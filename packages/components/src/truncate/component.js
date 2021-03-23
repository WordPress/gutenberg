/**
 * Internal dependencies
 */
import { createComponent } from '../ui/utils';
import useTruncate from './hook';

/**
 * `Truncate` is a typography primitive that trims text content.
 * For almost all cases, it is recommended that `Text`, `Heading`, or
 * `Subheading` is used to render text content. However,`Truncate` is
 * available for custom implementations.
 *
 * @example
 * ```jsx
 * import { Truncate } from `@wordpress/components/ui`;
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
const Truncate = createComponent( {
	as: 'span',
	useHook: useTruncate,
	name: 'Truncate',
} );

export default Truncate;
