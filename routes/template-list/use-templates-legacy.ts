/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	privateApis as corePrivateApis,
	type WpTemplate,
} from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import type { Template } from './types';

const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );

/**
 * Hook to fetch and return templates in legacy mode (no template activation).
 *
 * In legacy mode:
 * - Only fetches user-created templates (no registered templates)
 * - No active template computation
 * - Simpler filtering based on activeView
 *
 * @param {string} activeView - The active view type ('all' or author name).
 * @return {Object} Object containing records, loading state, and all records for building tabs.
 */
export function useTemplatesLegacy( activeView: string = 'all' ) {
	// Fetch all user templates
	const { records, isResolving } = useEntityRecordsWithPermissions(
		'postType',
		'wp_template',
		{
			per_page: -1,
		}
	);

	// Filter records based on active view
	const filteredRecords: Template[] = useMemo( () => {
		if ( ! records ) {
			return [];
		}

		// If 'all' view, return all records
		if ( activeView === 'all' ) {
			return records;
		}

		// Otherwise, filter by author_text
		return records.filter(
			( record: WpTemplate ) => record.author_text === activeView
		);
	}, [ records, activeView ] );

	return {
		records: filteredRecords,
		isLoading: isResolving,
		allRecords: records || [], // For building author tabs
	};
}
