/**
 * Internal dependencies
 */
import { useContextSystem, contextConnect } from '../ui/context';
import { VisuallyHiddenView } from './styles';

/**
 * @param {import('../ui/context').PolymorphicComponentProps<{ children: import('react').ReactNode }, 'div'>} props
 */
function VisuallyHidden( props ) {
	const contextProps = useContextSystem( props, 'VisuallyHidden' );
	return <VisuallyHiddenView { ...contextProps } />;
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
