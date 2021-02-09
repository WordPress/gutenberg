/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useVisuallyHidden } from './use-visually-hidden';

/**
 * `VisuallyHidden` is used hide content from the visual client, but keep it readable for screen readers.
 *
 * @example
 * ```jsx
 * <VisuallyHidden>
 *  <Text>Hidding</Text>
 * </VisuallyHidden>
 * ```
 */
const VisuallyHidden = createComponent( {
	as: 'div',
	useHook: useVisuallyHidden,
	name: 'VisuallyHidden',
} );

export default VisuallyHidden;
