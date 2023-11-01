/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { useContextSystem, contextConnect } from '../context';
import { visuallyHidden } from './styles';
import { View } from '../view';
import type { VisuallyHiddenProps } from './types';

function UnconnectedVisuallyHidden(
	props: WordPressComponentProps< VisuallyHiddenProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const { style: styleProp, ...contextProps } = useContextSystem(
		props,
		'VisuallyHidden'
	);
	return (
		<View
			ref={ forwardedRef }
			{ ...contextProps }
			style={ { ...visuallyHidden, ...( styleProp || {} ) } }
		/>
	);
}

/**
 * `VisuallyHidden` is a component used to render text intended to be visually
 * hidden, but will show for alternate devices, for example a screen reader.
 *
 * ```jsx
 * import { VisuallyHidden } from `@wordpress/components`;
 *
 * function Example() {
 *   return (
 *     <VisuallyHidden>
 *       <label>Code is Poetry</label>
 *     </VisuallyHidden>
 *   );
 * }
 * ```
 */
export const VisuallyHidden = contextConnect(
	UnconnectedVisuallyHidden,
	'VisuallyHidden'
);

export default VisuallyHidden;
