import { parse } from '@wordpress/block-serialization-default-parser';
import { useMemo } from '@wordpress/element';
import { getAdminBlock } from './registry';
import { serializeNode } from './serialize-node';
import { SsrFallbackBlock } from './ssr-fallback-block';
import type { RenderBlocks } from './types';

type ParsedNode = ReturnType< typeof parse >[ number ];

interface AdminBlockNodesProps {
	nodes: ParsedNode[];
	attributes: Record< string, unknown >;
	renderBlocks?: RenderBlocks;
}

/*
 * Walks parsed blocks in order, rendering each as its registered admin (React)
 * component and recursing into container blocks so the whole composition is one
 * React tree. A block with no registered admin component falls back to server
 * rendering, so a composition can mix both freely.
 */
function AdminBlockNodes( {
	nodes,
	attributes,
	renderBlocks,
}: AdminBlockNodesProps ) {
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

				/* Serializing the whole node renders its subtree in one pass. */
				if ( ! entry ) {
					return (
						<SsrFallbackBlock
							key={ index }
							markup={ serializeNode( node ) }
							attributes={ attributes }
							renderBlocks={ renderBlocks }
						/>
					);
				}

				const { component: AdminComponent, spec } = entry;
				const children = spec.supportsInnerBlocks ? (
					<AdminBlockNodes
						nodes={ node.innerBlocks }
						attributes={ attributes }
						renderBlocks={ renderBlocks }
					/>
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

	/* Per-instance values, forwarded to server-rendered blocks. */
	attributes?: Record< string, unknown >;

	/* Resolution for blocks with no admin component; without it they render nothing. */
	renderBlocks?: RenderBlocks;
}

/*
 * Renders a widget definition's composition as one React tree: each block in
 * parsed order, as its registered admin component or as server-rendered HTML.
 */
export function AdminBlockRenderer( {
	content,
	attributes,
	renderBlocks,
}: AdminBlockRendererProps ) {
	const nodes = useMemo( () => parse( content ?? '' ), [ content ] );

	/* Stable identity: the fallback's effect depends on this object. */
	const instanceAttributes = useMemo(
		() => attributes ?? {},
		[ attributes ]
	);

	return (
		<AdminBlockNodes
			nodes={ nodes }
			attributes={ instanceAttributes }
			renderBlocks={ renderBlocks }
		/>
	);
}
