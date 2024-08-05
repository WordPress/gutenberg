/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import DataViewsPagination from '../dataviews-pagination';
import BulkActionsToolbar from '../dataviews-bulk-actions-toolbar';

export default function DataViewsFooter() {
	const {
		paginationInfo: { totalItems = 0, totalPages },
	} = useContext( DataViewsContext );
	if ( ! totalItems || ! totalPages ) {
		return null;
	}
	return (
		!! totalItems && (
			<HStack
				expanded={ false }
				spacing={ 6 }
				justify="end"
				className="dataviews-footer"
			>
				<BulkActionsToolbar />
				<DataViewsPagination />
			</HStack>
		)
	);
}
