
/**
 * Internal dependencies
 */
import { renderAsRenderProps } from './utils';

/**
 * VisuallyHidden component to render text out non-visually
 * for use in devices such as a screen reader.
 */
function VisuallyHidden( {
	as = 'div',
	...props
} ) {
	return renderAsRenderProps( {
		as,
		className: 'components-visually-hidden',
		...props,
	} );
}
export default VisuallyHidden;

