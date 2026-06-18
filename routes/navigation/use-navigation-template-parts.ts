/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useEditorAssets } from '@wordpress/lazy-editor';

/**
 * Internal dependencies
 */
import {
	getTemplatePartMenuRefs,
	type TemplatePartMenuRef,
	type TemplatePartRecord,
} from './navigation-locations';

const NAVIGATION_POST_TYPE = 'wp_navigation';
const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

type NavigationRecord = {
	id: number;
};

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

export default function useNavigationTemplateParts(): {
	partMenuRefs: TemplatePartMenuRef[];
	templateParts: TemplatePartRecord[];
	editedContentByPartId: Record< string, string | { raw?: string } >;
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
					key: string | number
				) => { content?: string | { raw?: string } };
			};
			const edits: Record< string, string | { raw?: string } > = {};

			for ( const id of templatePartIds ) {
				const partEdits = getEntityRecordEdits(
					'postType',
					TEMPLATE_PART_POST_TYPE,
					id
				);

				if ( partEdits?.content ) {
					edits[ String( id ) ] = partEdits.content;
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

		return getTemplatePartMenuRefs(
			templateParts as TemplatePartRecord[],
			fallbackMenuId,
			editedContentByPartId
		);
	}, [
		areEditorAssetsReady,
		editedContentByPartId,
		fallbackMenuId,
		templateParts,
	] );

	return {
		partMenuRefs,
		templateParts: ( templateParts as TemplatePartRecord[] ) ?? [],
		editedContentByPartId,
		isResolving:
			isResolvingTemplateParts ||
			isResolvingFallbackMenu ||
			! areEditorAssetsReady,
	};
}
