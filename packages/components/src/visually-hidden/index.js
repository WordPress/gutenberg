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

/**
 * VisibilityHelper component to simplify common use-case of
 * conditionally hiding components.
 */
export function VisibilityHelper( {
	className,
	isHidden = false,
	as,
	...props
} ) {
	if ( isHidden ) {
		return <VisuallyHidden as={ as } { ...props } />;
	}

	return renderAsRenderProps( {
		as,
		className,
		...props,
	} );
}

export default VisuallyHidden;
