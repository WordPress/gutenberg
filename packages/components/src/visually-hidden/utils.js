/**
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 * @typedef Props
 * @property {T} [as='div'] Element to render
 * @property {import('react').ReactNode | ((props: import('react').ComponentProps<T>) => JSX.Element) } [children] Children or render props function
 */

/**
 * renderAsRenderProps is used to wrap a component and convert
 * the passed property "as" either a string or component, to the
 * rendered tag if a string, or component.
 *
 * See VisuallyHidden hidden for example.
 *
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 * @param {Props<T> & import('react').ComponentProps<T>} props A tag or component to render.
 * @return {JSX.Element} The rendered component.
 */
function renderAsRenderProps( { as: Component = 'div', ...props } ) {
	if ( typeof props.children === 'function' ) {
		return props.children( props );
	}
	return <Component { ...props } />;
}

export { renderAsRenderProps };
