import { getBlockType } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import type { select as globalSelect } from '@wordpress/data';

type InserterItem = {
	name: string;
	initialAttributes?: Record< string, unknown >;
};

/**
 * Finds the known post type at the insertion point, including nested contexts.
 *
 * The global inserter is outside the selected block's context provider. Apply
 * the providers on the insertion path before considering taxonomy associations.
 * A Post Template supplies the post type of its query, rather than the page
 * containing the Query block. Leave inherited or unresolved queries unknown.
 *
 * @param select       Registry select.
 * @param rootClientId Insertion root client ID.
 * @param rootContext  Context surrounding the insertion UI.
 * @return Known insertion post type.
 */
function getInsertionPostType(
	select: typeof globalSelect,
	rootClientId: string | null | undefined,
	rootContext: Record< string, unknown >
): string | undefined {
	const context = { ...rootContext };
	if ( rootClientId ) {
		const { getBlock, getBlockParents } = select( blockEditorStore );
		const ancestors = [ ...getBlockParents( rootClientId ), rootClientId ];
		for ( const clientId of ancestors ) {
			const block = getBlock( clientId );
			if ( ! block ) {
				return undefined;
			}
			const providesContext = getBlockType( block.name )?.providesContext;
			for ( const [ key, attribute ] of Object.entries(
				providesContext ?? {}
			) ) {
				context[ key ] = block.attributes[ attribute ];
			}
			if ( block.name === 'core/post-template' ) {
				const query = context.query;
				context.postType = undefined;
				if ( typeof context.previewPostType === 'string' ) {
					context.postType = context.previewPostType;
				} else if (
					query &&
					typeof query === 'object' &&
					'inherit' in query &&
					! query.inherit &&
					'postType' in query
				) {
					context.postType = query.postType;
				}
			}
		}
	}
	return typeof context.postType === 'string' ? context.postType : undefined;
}

/**
 * Hides Post Terms variations for taxonomies unavailable to the insertion post.
 *
 * Registered variations remain global: templates, patterns and unresolved
 * contexts can still offer every taxonomy until the association is known.
 *
 * @param select       Registry select.
 * @param items        Available inserter items.
 * @param rootClientId Insertion root client ID.
 * @param context      Context surrounding the insertion UI.
 * @return Applicable items, retaining their original identities.
 */
export default function filterInserterItems< Item extends InserterItem >(
	select: typeof globalSelect,
	items: Item[],
	rootClientId: string | null | undefined,
	context: Record< string, unknown >
): Item[] {
	if ( ! items.some( ( item ) => item.name === 'core/post-terms' ) ) {
		return items;
	}
	const postType = getInsertionPostType( select, rootClientId, context );
	if ( ! postType ) {
		return items;
	}
	const taxonomies = select( coreStore ).getTaxonomies();
	if ( ! taxonomies ) {
		return items;
	}
	return items.filter( ( item ) => {
		if ( item.name !== 'core/post-terms' ) {
			return true;
		}
		const taxonomy = taxonomies.find(
			( candidate ) => candidate.slug === item.initialAttributes?.term
		);
		return (
			! Array.isArray( taxonomy?.types ) ||
			taxonomy.types.includes( postType )
		);
	} );
}
