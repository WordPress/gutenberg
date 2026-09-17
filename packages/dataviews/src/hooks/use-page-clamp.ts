import { useEffect } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
import type { View } from '../types';

interface UsePageClampParams {
	view: View;
	onChangeView: ( view: View ) => void;
	isLoading: boolean;
	totalPages: number | null | undefined;
}

/**
 * Moves the view back to the last available page whenever it points past the
 * end of the collection — for instance after deleting the only item of the
 * last page — so the consumer isn't left requesting a page that no longer
 * exists.
 *
 * The page is left alone while data is loading and when the total is unknown
 * (a consumer that hasn't resolved its totals yet reports `null`).
 *
 * @param params              Hook parameters.
 * @param params.view         Current view.
 * @param params.onChangeView Callback to update the view.
 * @param params.isLoading    Whether data is currently loading.
 * @param params.totalPages   Number of available pages, if known.
 */
export default function usePageClamp( {
	view,
	onChangeView,
	isLoading,
	totalPages,
}: UsePageClampParams ) {
	const lastPage =
		typeof totalPages === 'number' && Number.isFinite( totalPages )
			? Math.max( totalPages, 1 )
			: null;
	const page = view.page;
	const goToLastPage = useEvent( () => {
		if ( lastPage !== null ) {
			onChangeView( { ...view, page: lastPage } );
		}
	} );

	useEffect( () => {
		if ( isLoading || lastPage === null || ! page || page <= lastPage ) {
			return;
		}
		goToLastPage();
	}, [ isLoading, lastPage, page, goToLastPage ] );
}
