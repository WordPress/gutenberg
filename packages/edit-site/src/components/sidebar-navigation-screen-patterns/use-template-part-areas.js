/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_PART_AREA_DEFAULT_CATEGORY,
	TEMPLATE_PART_POST_TYPE,
} from '../../utils/constants';

const useTemplatePartsGroupedByArea = ( items ) => {
	const allItems = items || [];

	const templatePartAreas = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetDefaultTemplatePartAreas(),
		[]
	);

	// Create map of template areas ensuring that default areas are displayed before
	// any custom registered template part areas.
	const knownAreas = {
		header: {},
		footer: {},
		sidebar: {},
		uncategorized: {},
	};

	templatePartAreas.forEach(
		( templatePartArea ) =>
			( knownAreas[ templatePartArea.area ] = {
				...templatePartArea,
				templateParts: [],
			} )
	);

	const groupedByArea = allItems.reduce( ( accumulator, item ) => {
		const key = accumulator[ item.area ]
			? item.area
			: TEMPLATE_PART_AREA_DEFAULT_CATEGORY;
		accumulator[ key ].templateParts.push( item );
		return accumulator;
	}, knownAreas );

	return groupedByArea;
};

export default function useTemplatePartAreas() {
	const { records: templateParts, isResolving: isLoading } = useEntityRecords(
		'postType',
		TEMPLATE_PART_POST_TYPE,
		{ per_page: -1 }
	);

	return {
		hasTemplateParts: templateParts ? !! templateParts.length : false,
		isLoading,
		templatePartAreas: useTemplatePartsGroupedByArea( templateParts ),
	};
}
