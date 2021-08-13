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
		const aaa = getBlocks( clientId );
		const arr = aaa?.find( ( innerBlock ) => {
			return [
				'core/query-pagination-next',
				'core/query-pagination-previous',
			].includes( innerBlock.name );
		} );
		return arr?.attributes?.arrow || '';
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
