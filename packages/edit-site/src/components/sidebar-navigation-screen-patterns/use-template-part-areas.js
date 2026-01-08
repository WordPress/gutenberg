/**
 * WordPress dependencies
 */
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

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
			select( coreStore ).getCurrentTheme()
				?.default_template_part_areas || [],
		[]
	);

	// Create map of template areas ensuring that default areas are displayed before
	// any custom registered template part areas.
	const knownAreas = {
		header: {},
		footer: {},
		sidebar: {},
		uncategorized: {},
		overlay: {},
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
		accumulator[ key ]?.templateParts?.push( item );
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
