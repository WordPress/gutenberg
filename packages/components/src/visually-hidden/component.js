/**
 * Internal dependencies
 */
import { useContextSystem, contextConnect } from '../ui/context';
import { visuallyHidden } from './styles';

/**
 * @param {import('../ui/context').PolymorphicComponentProps<{ children: import('react').ReactNode }, 'div'>} props
 */
function VisuallyHidden( props ) {
	const { style: styleProp, ...contextProps } = useContextSystem(
		props,
		'VisuallyHidden'
	);
	return (
		<div
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
