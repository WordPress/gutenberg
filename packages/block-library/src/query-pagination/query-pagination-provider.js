/**
 * WordPress dependencies
 */
import {
	createContext,
	useState,
	useMemo,
	useContext,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

const QueryPaginationContext = createContext();
export default function QueryPaginationProvider( { clientId, children } ) {
	const paginationArrow = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		const innerBlocks = getBlocks( clientId );
		/**
		 * Query Pagination Next/Previous blocks' arrows should be synced
		 * inside a Query Pagination block. So we initialize the context
		 * arrow value from the the first matching Query Pagination
		 * Next/Previous block we find.
		 */
		const match = innerBlocks?.find( ( innerBlock ) => {
			return [
				'core/query-pagination-next',
				'core/query-pagination-previous',
			].includes( innerBlock.name );
		} );
		return match?.attributes?.arrow;
	}, [] );
	const [ queryPaginationContext, setQueryPaginationContext ] = useState( {
		arrow: paginationArrow,
	} );
	return (
		<QueryPaginationContext.Provider
			value={ useMemo(
				() => [
					queryPaginationContext,
					( newContext ) =>
						setQueryPaginationContext( ( currentContext ) => ( {
							...currentContext,
							...newContext,
						} ) ),
				],
				[ queryPaginationContext ]
			) }
		>
			{ children }
		</QueryPaginationContext.Provider>
	);
}

export function useQueryPaginationContext() {
	return useContext( QueryPaginationContext );
}
