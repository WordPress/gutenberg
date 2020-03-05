/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { renderAsRenderProps } from './utils';

/**
 * VisuallyHidden component to render text out non-visually
 * for use in devices such as a screen reader.
 */
function VisuallyHidden( { as = 'div', className, ...props } ) {
	return renderAsRenderProps( {
		as,
		className: classnames( 'components-visually-hidden', className ),
		...props,
	} );
}
export default VisuallyHidden;
