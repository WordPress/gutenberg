/**
 * Internal dependencies
 */
import { createComponent } from '../ui/utils';
import { useSurface } from './hook';

/**
 * `Surface` is a core component that renders a primary background color.
 *
 * In the example below, notice how the `Surface` renders in white (or dark gray if in dark mode).
 *
 * ```jsx
 * import {
 *	__experimentalSurface as Surface,
 *	__experimentalText as Text,
 * } from '@wordpress/components';
 *
 * function Example() {
 * 	return (
 * 		<Surface>
 * 			<Text>Code is Poetry</Text>
 * 		</Surface>
 * 	);
 * }
 * ```
 */
export default createComponent( {
	as: 'div',
	useHook: useSurface,
	name: 'Surface',
} );
