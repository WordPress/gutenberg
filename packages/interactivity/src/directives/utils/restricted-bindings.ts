/**
 * Attributes that can be bound on an `object` element, besides `aria-*`
 * attributes and `data-*` attributes other than directives.
 *
 * WordPress only allows an `object` element in post content when it has
 * checked the values of its `data` and `type` attributes, which the runtime
 * cannot repeat. Binding is therefore limited to attributes that cannot change
 * what the element loads: `width`, `height`, and the global attributes KSES
 * allows on any element, except that every `aria-*` attribute is allowed where
 * KSES lists only some. A `data-wp-*` attribute is refused because it is a
 * directive, which could bind `data` or `type` once rendered.
 *
 * The server enforces the same set when it processes directives, in
 * `WP_Interactivity_API::data_wp_bind_processor()`, so both refuse the same
 * bindings.
 */
const objectAttributes = new Set( [
	'class',
	'dir',
	'height',
	'hidden',
	'id',
	'lang',
	'role',
	'style',
	'tabindex',
	'title',
	'width',
] );

/**
 * Checks whether an attribute can be bound on an element. Only `object`
 * elements limit their bindings.
 *
 * @param type      Element type, as in the vDOM.
 * @param attribute Name of the bound attribute.
 * @return Whether the attribute can be bound.
 */
export const isBindingAllowed = ( type: unknown, attribute: string ) => {
	if ( typeof type !== 'string' || type.toLowerCase() !== 'object' ) {
		return true;
	}
	const name = attribute.toLowerCase();
	return (
		objectAttributes.has( name ) ||
		name.startsWith( 'aria-' ) ||
		( name.startsWith( 'data-' ) && ! name.startsWith( 'data-wp-' ) )
	);
};
