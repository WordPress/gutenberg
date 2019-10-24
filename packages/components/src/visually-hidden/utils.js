/**
 * Utility Functions
 */

/**
 * renderAsRenderProps is used to wrap a component and convert
 * the passed property "as" either a string or component, to the
 * rendered tag if a string, or component.
 *
 * See VisuallyHidden hidden for example.
 *
 * @param {string|Component} as A tag or component to render.
 * @return {Component} The rendered component.
 */
function renderAsRenderProps( { as: Component = 'div', ...props } ) {
	if ( typeof props.children === 'function' ) {
		return props.children( props );
	}
	return <Component { ...props } />;
}

export { renderAsRenderProps };
