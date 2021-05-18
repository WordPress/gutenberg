/**
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 * @typedef OwnProps
 * @property {T} [as='div'] Component to render
 * @property {import('react').ReactNode | ((props: import('react').ComponentProps<T>) => JSX.Element) } [children] Children or render props function
 */

/**
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 * @typedef {OwnProps<T> & import('react').ComponentProps<T>} Props
 */

/**
 * renderAsRenderProps is used to wrap a component and convert
 * the passed property "as" either a string or component, to the
 * rendered tag if a string, or component.
 *
 * See VisuallyHidden hidden for example.
 *
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 * @param {Props<T>} props
 * @return {JSX.Element} The rendered element.
 */
function renderAsRenderProps( { as: Component = 'div', ...props } ) {
	if ( typeof props.children === 'function' ) {
		return props.children( props );
	}
	return <Component { ...props } />;
}

export { renderAsRenderProps };
