/**
 * Internal dependencies
 */
import { createComponent } from '../ui/utils';
import { useHeading } from './hook';

/**
 * `Heading` renders headings and titles using the library's typography system.
 *
 * @example
 * ```jsx
 * import { Heading } from `@wordpress/components/ui`
 *
 * function Example() {
 *   return <Heading>Code is Poetry</Heading>;
 * }
 * ```
 */
const Heading = createComponent( {
	as: 'h1',
	useHook: useHeading,
	name: 'Heading',
} );

export default Heading;
