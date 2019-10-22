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

// render "as" to be either string (tag name) or component (fn)
function renderAsRenderProps( { as: T = 'div', ...props } ) {
	if ( typeof props.children === 'function' ) {
		return props.children( props );
	}
	return <T { ...props } />;
}

export default VisuallyHidden;
