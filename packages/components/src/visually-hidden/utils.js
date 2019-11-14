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
 * @param {string|WPComponent} as A tag or component to render.
 * @return {WPComponent} The rendered component.
 */
function renderAsRenderProps( { as: Component = 'div', ...props } ) {
	if ( typeof props.children === 'function' ) {
		return props.children( props );
	}
	return <Component { ...props } />;
}

export { renderAsRenderProps };
