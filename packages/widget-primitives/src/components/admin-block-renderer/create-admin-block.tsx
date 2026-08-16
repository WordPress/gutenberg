import type { AdminBlockComponentProps, AdminBlockSpec } from './types';

/*
 * Maps a block's parsed attributes to the wrapped component's props, applying
 * each attribute's default and prop rename.
 */
function buildProps(
	spec: AdminBlockSpec,
	attributes: Record< string, unknown >,
	children: AdminBlockComponentProps[ 'children' ]
): Record< string, unknown > {
	const props: Record< string, unknown > = {};

	for ( const [ name, attribute ] of Object.entries( spec.attributes ) ) {
		const raw = attributes[ name ] ?? attribute.default;
		if ( raw === undefined ) {
			continue;
		}
		props[ attribute.prop ?? name ] = raw;
	}

	if ( spec.supportsInnerBlocks ) {
		props.children = children;
	}

	return props;
}

/*
 * Produces the admin (runtime React) component for a block spec: it reads the
 * block's parsed attributes, maps them to the wrapped component's props, and
 * passes rendered inner blocks as children.
 *
 * This is the eventless variant. Connection wiring, block context, and
 * read-bindings are layered on by later steps.
 */
export function createAdminBlock( spec: AdminBlockSpec ) {
	const Wrapped = spec.component;

	return function AdminBlock( {
		attributes,
		children,
	}: AdminBlockComponentProps ) {
		return <Wrapped { ...buildProps( spec, attributes, children ) } />;
	};
}
