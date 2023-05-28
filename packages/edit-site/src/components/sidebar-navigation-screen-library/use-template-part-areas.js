/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';

const getTemplatePartAreas = ( items ) => {
	const allItems = items || [];

	const groupedByArea = allItems.reduce(
		( accumulator, item ) => {
			const key = accumulator[ item.area ] ? item.area : 'uncategorized';
			accumulator[ key ].push( item );
			return accumulator;
		},
		{ header: [], footer: [], sidebar: [], uncategorized: [] }
	);

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
		templatePartAreas: getTemplatePartAreas( templateParts ),
	};
}
