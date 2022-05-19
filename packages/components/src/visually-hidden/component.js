/**
 * Internal dependencies
 */
import { useContextSystem, contextConnect } from '../ui/context';
import { visuallyHidden } from './styles';
import { View } from '../view';

/**
 * @param {import('../ui/context').WordPressComponentProps<{ children: import('react').ReactNode }, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                                               forwardedRef
 */
function VisuallyHidden( props, forwardedRef ) {
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
 * @example
 * ```jsx
 * import { VisuallyHidden } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<VisuallyHidden>
 * 			<label>Code is Poetry</label>
 * 		</VisuallyHidden>
 * 	);
 * }
 * ```
 */
const ConnectedVisuallyHidden = contextConnect(
	VisuallyHidden,
	'VisuallyHidden'
);

export default ConnectedVisuallyHidden;
