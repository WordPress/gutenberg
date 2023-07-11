/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

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
		const key = accumulator[ item.area ] ? item.area : 'uncategorized';
		accumulator[ key ].templateParts.push( item );
		return accumulator;
	}, knownAreas );

	return groupedByArea;
};

export default function useTemplatePartAreas() {
	const { records: templateParts, isResolving: isLoading } = useEntityRecords(
		'postType',
		'wp_template_part',
		{ per_page: -1 }
	);

	return {
		hasTemplateParts: templateParts ? !! templateParts.length : false,
		isLoading,
		templatePartAreas: useTemplatePartsGroupedByArea( templateParts ),
	};
}
