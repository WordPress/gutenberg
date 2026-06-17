/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useEditorAssets } from '@wordpress/lazy-editor';
// @ts-expect-error - No type declarations available for @wordpress/blocks.
import { parse } from '@wordpress/blocks';

const NAVIGATION_POST_TYPE = 'wp_navigation';
const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

const TEMPLATE_PARTS_QUERY = {
	per_page: -1,
};

const FALLBACK_NAVIGATION_QUERY = {
	per_page: 1,
	orderby: 'date',
	order: 'desc',
	status: 'publish',
	_fields: 'id',
};

type ParsedBlock = {
	name?: string;
	attributes?: {
		ref?: number | string;
	};
	innerBlocks?: ParsedBlock[];
};

type TemplatePartRecord = {
	id: number;
	content?:
		| string
		| {
				raw?: string;
				rendered?: string;
		  };
};

type NavigationRecord = {
	id: number;
};

export type TemplatePartMenuRef = {
	part: TemplatePartRecord;
	menuIds: number[];
};

function getRawContent(
	part: TemplatePartRecord,
	editedContent?: string | { raw?: string }
) {
	if ( editedContent ) {
		return typeof editedContent === 'string'
			? editedContent
			: editedContent.raw;
	}

	return typeof part.content === 'string' ? part.content : part.content?.raw;
}

function getReferencedMenuIds(
	blocks: ParsedBlock[],
	fallbackMenuId?: number
): number[] {
	const menuIds: number[] = [];
	const stack = [ ...blocks ];

	while ( stack.length ) {
		const { innerBlocks = [], ...block } = stack.shift() ?? {};

		if ( innerBlocks.length ) {
			stack.unshift( ...innerBlocks );
		}

		if ( block.name !== 'core/navigation' ) {
			continue;
		}

		if ( block.attributes?.ref ) {
			const menuId = Number( block.attributes.ref );

			if ( Number.isFinite( menuId ) ) {
				menuIds.push( menuId );
			}
			continue;
		}

		if ( ! innerBlocks.length && fallbackMenuId ) {
			menuIds.push( fallbackMenuId );
		}
	}

	return menuIds;
}

export default function useNavigationTemplateParts(): {
	partMenuRefs: TemplatePartMenuRef[];
	isResolving: boolean;
} {
	const { isReady: areEditorAssetsReady } = useEditorAssets();

	const { records: templateParts, isResolving: isResolvingTemplateParts } =
		useEntityRecords(
			'postType',
			TEMPLATE_PART_POST_TYPE,
			TEMPLATE_PARTS_QUERY
		);

	const { records: fallbackMenus, isResolving: isResolvingFallbackMenu } =
		useEntityRecords(
			'postType',
			NAVIGATION_POST_TYPE,
			FALLBACK_NAVIGATION_QUERY
		);

	const fallbackMenuId = ( fallbackMenus as NavigationRecord[] )?.[ 0 ]?.id;

	const templatePartIds = useMemo(
		() =>
			( templateParts as TemplatePartRecord[] | undefined )?.map(
				( part ) => part.id
			) ?? [],
		[ templateParts ]
	);

	const editedContentByPartId = useSelect(
		( select ) => {
			if ( ! templatePartIds.length ) {
				return {};
			}

			const { getEntityRecordEdits } = select( coreStore ) as {
				getEntityRecordEdits: (
					kind: string,
					name: string,
					key: number
				) => { content?: string | { raw?: string } };
			};
			const edits: Record< number, string | { raw?: string } > = {};

			for ( const id of templatePartIds ) {
				const partEdits = getEntityRecordEdits(
					'postType',
					TEMPLATE_PART_POST_TYPE,
					id
				);

				if ( partEdits?.content ) {
					edits[ id ] = partEdits.content;
				}
			}

			return edits;
		},
		[ templatePartIds ]
	);

	const partMenuRefs = useMemo( () => {
		if ( ! areEditorAssetsReady || ! templateParts ) {
			return [];
		}

		return ( templateParts as TemplatePartRecord[] ).reduce(
			( accumulator: TemplatePartMenuRef[], part ) => {
				const rawContent = getRawContent(
					part,
					editedContentByPartId[ part.id ]
				);

				if ( ! rawContent ) {
					return accumulator;
				}

				const menuIds = getReferencedMenuIds(
					parse( rawContent ),
					fallbackMenuId
				);

				if ( menuIds.length ) {
					accumulator.push( { part, menuIds } );
				}

				return accumulator;
			},
			[]
		);
	}, [
		areEditorAssetsReady,
		editedContentByPartId,
		fallbackMenuId,
		templateParts,
	] );

	return {
		partMenuRefs,
		isResolving:
			isResolvingTemplateParts ||
			isResolvingFallbackMenu ||
			! areEditorAssetsReady,
	};
}
