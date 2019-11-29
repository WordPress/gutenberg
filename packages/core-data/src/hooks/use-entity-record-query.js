/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { useSelect, __experimentalResolveSelect } from '@wordpress/data';

export default function useEntityRecordQuery(
	kind,
	name,
	{ initialPage = 1, perPage = 10, ...query } = {}
) {
	const [ page, setPage ] = useState( initialPage );
	const [ hasNextPage, setHasNextPage ] = useState( true );
	const [ isNextPageLoading, setIsNextPageLoading ] = useState( false );

	const records = useSelect(
		( select ) =>
			select( 'core' ).getCachedEntityRecords( kind, name, {
				...query,
				page: initialPage,
				per_page: ( page - initialPage + 1 ) * perPage,
			} ),
		[ kind, name, initialPage, page, perPage ]
	);

	const loadNextPage = useCallback( async () => {
		setIsNextPageLoading( true );
		const nextRecords = await __experimentalResolveSelect(
			'core'
		).getEntityRecords( kind, name, {
			...query,
			page: page + 1, // Fetch the next page.
			// Fetch an extra record to see if we have another page.
			per_page: perPage + 1,
		} );
		setPage( ( _page ) => _page + 1 );
		if ( nextRecords.length < perPage + 1 ) {
			setHasNextPage( false );
		}
		setIsNextPageLoading( false );
	}, [ kind, name, page, perPage ] );

	return {
		records,
		page,
		hasNextPage,
		loadNextPage,
		isNextPageLoading,
	};
}
