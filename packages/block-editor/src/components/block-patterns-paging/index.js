/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Pagination from '../pagination';

export default function BlockPatternsPaging( {
	currentPage,
	numPages,
	changePage,
	totalItems,
} ) {
	return (
		<VStack className="block-editor-patterns__grid-pagination-wrapper">
			<Text variant="muted">
				{ sprintf(
					// translators: %s: Total number of patterns.
					_n( '%s item', '%s items', totalItems ),
					totalItems
				) }
			</Text>
			{ numPages > 1 && (
				<Pagination
					currentPage={ currentPage }
					numPages={ numPages }
					changePage={ changePage }
					className="block-editor-patterns__grid-pagination"
				/>
			) }
		</VStack>
	);
}
