/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/block-serialization-default-parser';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getAdminBlock } from './registry';

type ParsedNode = ReturnType< typeof parse >[ number ];

interface AdminBlockNodesProps {
	nodes: ParsedNode[];
}

/*
 * Walks parsed blocks in order, rendering each as its registered admin (React)
 * component and recursing into container blocks so the whole composition is one
 * React tree. A block with no registered admin component renders nothing here;
 * step 10 adds the per-block SSR fallback for those.
 */
function AdminBlockNodes( { nodes }: AdminBlockNodesProps ) {
	return (
		<>
			{ nodes.map( ( node, index ) => {
				/*
				 * The grammar parser emits whitespace-only freeform nodes
				 * between blocks; drop them so they do not render.
				 */
				if ( ! node.blockName && ! node.innerHTML.trim() ) {
					return null;
				}

				const entry = node.blockName
					? getAdminBlock( node.blockName )
					: undefined;

				if ( ! entry ) {
					return null;
				}

				const { component: AdminComponent, spec } = entry;
				const children = spec.supportsInnerBlocks ? (
					<AdminBlockNodes nodes={ node.innerBlocks } />
				) : undefined;

				return (
					<AdminComponent
						key={ index }
						attributes={ node.attrs ?? {} }
					>
						{ children }
					</AdminComponent>
				);
			} ) }
		</>
	);
}

interface AdminBlockRendererProps {
	/* Composition (raw block markup) for the widget definition. */
	content?: string | null;

	/*
	 * Per-instance attribute values. Consumed by later steps (seeded as block
	 * context so read-bindings resolve per instance); accepted here so the
	 * render contract is stable.
	 */
	attributes?: Record< string, unknown >;
}

/*
 * Renders a server-defined widget definition's composition as a single React
 * tree. Each block becomes its registered admin (React) component, in parsed
 * order. This is the render path for every server-defined widget type. The
 * parse is memoized by `content`.
 */
export function AdminBlockRenderer( { content }: AdminBlockRendererProps ) {
	const nodes = useMemo( () => parse( content ?? '' ), [ content ] );

	return <AdminBlockNodes nodes={ nodes } />;
}
