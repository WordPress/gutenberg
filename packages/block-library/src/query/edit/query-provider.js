/**
 * WordPress dependencies
 */
import {
	createContext,
	useState,
	useMemo,
	useContext,
} from '@wordpress/element';

const QueryContext = createContext();
export default function QueryProvider( { children } ) {
	const [ queryContext, setQueryContext ] = useState( { page: 1 } );
	return (
		<QueryContext.Provider
			value={ useMemo(
				() => [
					queryContext,
					( newQueryContext ) =>
						setQueryContext( ( currentQueryContext ) => ( {
							...currentQueryContext,
							...newQueryContext,
						} ) ),
				],
				[ queryContext ]
			) }
		>
			{ children }
		</QueryContext.Provider>
	);
}

export function useQueryContext() {
	return useContext( QueryContext );
}
