import apiFetch from '@wordpress/api-fetch';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import type { Post } from '@wordpress/core-data';

type Level = {
	records: Post[];
	page: number;
	hasMore: boolean;
	isLoading?: boolean;
	error?: string;
};
type State = { key: string; levels: Record< string, Level > };
const EMPTY_LEVEL: Level = { records: [], page: 0, hasMore: true };
const EMPTY_LEVELS: Record< string, Level > = {};

async function errorMessage( error: unknown ): Promise< string > {
	if (
		typeof error === 'object' &&
		error !== null &&
		'json' in error &&
		typeof error.json === 'function'
	) {
		try {
			error = await error.json();
		} catch {
			// A response without a JSON error body still needs a retryable message.
		}
	}
	return typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof error.message === 'string' &&
		error.message
		? stripHTML( error.message )
		: __( 'Could not load pages. Try again.' );
}

export default function usePageHierarchy(
	enabled: boolean,
	query: Record< string, any >,
	queryKey: string
) {
	const [ state, setState ] = useState< State >( {
		key: queryKey,
		levels: {},
	} );
	const stateRef = useRef( state );
	const requestsRef = useRef( {
		key: queryKey,
		controllers: new Map< string, AbortController >(),
	} );
	const queryRef = useRef( query );
	useEffect( () => {
		queryRef.current = query;
	}, [ query ] );

	const load = useCallback(
		async ( parentId: string | null ) => {
			if ( ! enabled ) {
				return;
			}
			if ( requestsRef.current.key !== queryKey ) {
				requestsRef.current = { key: queryKey, controllers: new Map() };
				stateRef.current = { key: queryKey, levels: {} };
			}
			const id = parentId ?? 'root';
			const current = stateRef.current.levels[ id ] ?? EMPTY_LEVEL;
			if (
				! current.hasMore ||
				requestsRef.current.controllers.has( id )
			) {
				return;
			}
			const controller = new AbortController();
			requestsRef.current.controllers.set( id, controller );
			const update = ( level: Level ) => {
				if (
					requestsRef.current.key !== queryKey ||
					controller.signal.aborted
				) {
					return;
				}
				stateRef.current = {
					key: queryKey,
					levels: {
						...stateRef.current.levels,
						[ id ]: level,
					},
				};
				setState( stateRef.current );
			};
			update( { ...current, isLoading: true, error: undefined } );
			try {
				const page = current.page + 1;
				const response = await apiFetch( {
					path: addQueryArgs( '/wp/v2/pages', {
						...queryRef.current,
						context: 'edit',
						parent: parentId ?? 0,
						page,
					} ),
					parse: false,
					signal: controller.signal,
				} );
				const records: Post[] = await response.json();
				const totalPages = Number(
					response.headers.get( 'X-WP-TotalPages' )
				);
				const ids = new Set(
					current.records.map( ( record ) => record.id )
				);
				update( {
					records: [
						...current.records,
						...records.filter(
							( record ) => ! ids.has( record.id )
						),
					],
					page,
					isLoading: false,
					hasMore: totalPages
						? page < totalPages
						: records.length >= queryRef.current.per_page,
				} );
			} catch ( error ) {
				update( {
					...current,
					isLoading: false,
					error: await errorMessage( error ),
				} );
			} finally {
				if (
					requestsRef.current.controllers.get( id ) === controller
				) {
					requestsRef.current.controllers.delete( id );
				}
			}
		},
		[ enabled, queryKey ]
	);

	useEffect( () => {
		if (
			enabled &&
			( requestsRef.current.key !== queryKey ||
				! stateRef.current.levels.root )
		) {
			load( null );
		}
		return () => {
			if ( requestsRef.current.controllers.size ) {
				requestsRef.current.controllers.forEach( ( controller ) =>
					controller.abort()
				);
				requestsRef.current.controllers.clear();
				stateRef.current = { key: 'aborted', levels: {} };
			}
		};
	}, [ enabled, load, queryKey ] );

	const levels = state.key === queryKey ? state.levels : EMPTY_LEVELS;
	const records = useMemo(
		() => [
			...( levels.root?.records ?? [] ),
			...Object.entries( levels ).flatMap( ( [ id, level ] ) =>
				id === 'root' ? [] : level.records
			),
		],
		[ levels ]
	);
	return {
		records,
		getPaginationInfo: ( parentId: string | null ) => {
			const level = levels[ parentId ?? 'root' ];
			return level
				? {
						hasMore: level.hasMore,
						isLoading: level.isLoading,
						error: level.error,
					}
				: undefined;
		},
		load,
		isLoading:
			! levels.root || ( !! levels.root.isLoading && ! levels.root.page ),
	};
}
