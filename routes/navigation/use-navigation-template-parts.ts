/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { parse } from '@wordpress/blocks';
import { useEditorAssets } from '@wordpress/lazy-editor';

const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

/**
 * Returns all navigation menu IDs referenced by navigation blocks in a tree.
 *
 * For each core/navigation block found:
 *  1. Explicit ref: collects block.attributes.ref
 *  2. Unbound block (no ref, no inner blocks): collects fallbackMenuId
 *
 * @param {Array}              blocks         Array of block objects to search.
 * @param {number | undefined} fallbackMenuId ID of the site's fallback menu.
 * @return {number[]} Menu IDs referenced by navigation blocks in the tree.
 */
function getReferencedMenuIds(
	blocks: any[],
	fallbackMenuId: number | undefined
): number[] {
	const menuIds: number[] = [];
	const stack = [ ...blocks ];
	while ( stack.length ) {
		const { innerBlocks, ...block } = stack.shift();
		if ( innerBlocks ) {
			stack.unshift( ...innerBlocks );
		}
		if ( block.name === 'core/navigation' ) {
			if ( block.attributes?.ref ) {
				menuIds.push( block.attributes.ref );
			} else if (
				! block.attributes?.ref &&
				! innerBlocks?.length &&
				fallbackMenuId
			) {
				menuIds.push( fallbackMenuId );
			}
		}
	}
	return menuIds;
}

export type PartMenuRef = { part: any; menuIds: number[] };

/**
 * Fetches all template parts and resolves which navigation menus each one
 * references.
 *
 * Waits for editor assets to be ready before parsing so that block types are
 * registered and parse() returns correct results.
 *
 * Reads edited entity content (unsaved local edits) for matching, but returns
 * the original entity records so downstream consumers get the expected shape.
 *
 * @return {Object} Object with partMenuRefs array and isResolving boolean.
 *                  partMenuRefs contains only parts that reference at least one
 *                  navigation menu.
 */
export default function useNavigationTemplateParts(): {
	partMenuRefs: PartMenuRef[];
	isResolving: boolean;
} {
	const { isReady: assetsReady } = useEditorAssets();

	const { records: templateParts, isResolving: isResolvingParts } =
		useEntityRecords( 'postType', TEMPLATE_PART_POST_TYPE, {
			per_page: -1,
		} );

	const { records: fallbackMenus, isResolving: isResolvingFallback } =
		useEntityRecords( 'postType', 'wp_navigation', {
			per_page: 1,
			orderby: 'date',
			order: 'desc',
			status: 'publish',
			_fields: 'id',
		} );

	const fallbackMenuId = ( fallbackMenus as any )?.[ 0 ]?.id;

	// Read any pending (unsaved) edits for each template part so we can
	// detect newly-assigned navigation refs immediately after
	// editEntityRecord is called.
	const templatePartIds = useMemo(
		() => ( templateParts as any[] )?.map( ( p ) => p.id ) ?? [],
		[ templateParts ]
	);

	const editsMap = useSelect(
		( select ) => {
			if ( ! templatePartIds.length ) {
				return {};
			}
			// @ts-expect-error - getEntityRecordEdits types
			const { getEntityRecordEdits } = select( 'core' );
			const map: Record< string, any > = {};
			for ( const id of templatePartIds ) {
				const edits = getEntityRecordEdits(
					'postType',
					TEMPLATE_PART_POST_TYPE,
					id
				);
				if ( edits?.content ) {
					map[ id ] = edits.content;
				}
			}
			return map;
		},
		[ templatePartIds ]
	);

	const partMenuRefs = useMemo( () => {
		if ( ! assetsReady || ! templateParts ) {
			return [];
		}

		return ( templateParts as any[] ).reduce(
			( acc: PartMenuRef[], part ) => {
				// Prefer edited content (unsaved local edits) over the
				// server version so that the UI updates immediately after
				// assigning a navigation menu via editEntityRecord.
				const editedContent = editsMap[ part.id ];
				let rawContent: string | undefined;
				if ( editedContent ) {
					rawContent =
						typeof editedContent === 'string'
							? editedContent
							: editedContent?.raw;
				}
				if ( ! rawContent ) {
					rawContent = part?.content?.raw;
				}
				if ( ! rawContent || typeof rawContent !== 'string' ) {
					return acc;
				}
				const blocks = parse( rawContent );
				const menuIds = getReferencedMenuIds( blocks, fallbackMenuId );
				if ( menuIds.length > 0 ) {
					acc.push( { part, menuIds } );
				}
				return acc;
			},
			[]
		);
	}, [ assetsReady, templateParts, editsMap, fallbackMenuId ] );

	return {
		partMenuRefs,
		isResolving: isResolvingParts || isResolvingFallback || ! assetsReady,
	};
}
