import { privateApis as corePrivateApis } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';
import type { Template } from './types';

const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );

const EMPTY_ARRAY: Template[] = [];

/**
 * Hook to fetch and return every template.
 *
 * Filtering by author happens client-side through the view: the active
 * view's locked `author` filter is applied by `filterSortAndPaginate`.
 *
 * @return {Object} Object containing the records and the loading state.
 */
export function useTemplates() {
	const { records, isResolving } = useEntityRecordsWithPermissions(
		'postType',
		'wp_template',
		{
			per_page: -1,
		}
	);

	return {
		records: ( records ?? EMPTY_ARRAY ) as Template[],
		isLoading: isResolving,
	};
}
