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

const EMPTY_LEVEL = { records: [], page: 0, hasMore: true };
const EMPTY_LEVELS = {};

function totalFromHeader( header ) {
	const value = header?.trim() ? Number( header ) : NaN;
	return Number.isInteger( value ) && value >= 0 ? value : undefined;
}

async function errorMessage( error ) {
	if ( typeof error?.json === 'function' ) {
		try {
			error = await error.json();
		} catch {
			// A response without a JSON error body still needs a retryable message.
		}
	}
	return typeof error?.message === 'string' && error.message
		? stripHTML( error.message )
		: __( 'Could not load pages. Try again.' );
}

export default function usePageHierarchy( enabled, query, queryKey ) {
	const [ state, setState ] = useState( { key: queryKey, levels: {} } );
	const stateRef = useRef( state );
	const requestsRef = useRef( {
		key: queryKey,
		enabled: false,
		controllers: new Map(),
	} );
	const queryRef = useRef( query );
	useEffect( () => {
		queryRef.current = query;
	}, [ query ] );

	const load = useCallback(
		async ( parentId ) => {
			const requests = requestsRef.current;
			if (
				! enabled ||
				! requests.enabled ||
				requests.key !== queryKey
			) {
				return;
			}
			const id = parentId ?? 'root';
			const current = stateRef.current.levels[ id ] ?? EMPTY_LEVEL;
			if ( ! current.hasMore || requests.controllers.has( id ) ) {
				return;
			}
			const controller = new AbortController();
			requests.controllers.set( id, controller );
			const update = ( level ) => {
				if (
					requestsRef.current !== requests ||
					controller.signal.aborted
				) {
					return;
				}
				stateRef.current = {
					key: queryKey,
					levels: { ...stateRef.current.levels, [ id ]: level },
				};
				setState( stateRef.current );
			};
			update( { ...current, isLoading: true, error: undefined } );
			const page = current.page + 1;
			const requestQuery = {
				...queryRef.current,
				context: 'edit',
				parent: parentId ?? 0,
				page,
			};
			try {
				const response = await apiFetch( {
					path: addQueryArgs( '/wp/v2/pages', requestQuery ),
					parse: false,
					signal: controller.signal,
				} );
				const records = await response.json();
				if ( ! Array.isArray( records ) ) {
					throw new Error();
				}
				const totalPages = totalFromHeader(
					response.headers.get( 'X-WP-TotalPages' )
				);
				const ids = new Set(
					current.records.map( ( record ) => record.id )
				);
				update( {
					records: [
						...current.records,
						...records.filter( ( record ) => {
							if ( ids.has( record.id ) ) {
								return false;
							}
							ids.add( record.id );
							return true;
						} ),
					],
					totalItems: totalFromHeader(
						response.headers.get( 'X-WP-Total' )
					),
					page,
					isLoading: false,
					hasMore:
						totalPages !== undefined
							? page < totalPages
							: records.length >= requestQuery.per_page,
				} );
			} catch ( error ) {
				if ( ! controller.signal.aborted ) {
					update( {
						...current,
						isLoading: false,
						error: await errorMessage( error ),
					} );
				}
			} finally {
				if ( requests.controllers.get( id ) === controller ) {
					requests.controllers.delete( id );
				}
			}
		},
		[ enabled, queryKey ]
	);

	useEffect( () => {
		const requests = { key: queryKey, enabled, controllers: new Map() };
		requestsRef.current = requests;
		const levels = {
			...( stateRef.current.key === queryKey
				? stateRef.current.levels
				: EMPTY_LEVELS ),
		};
		// Callers retain expanded IDs on a toggle. Keep settled branches and
		// resume aborted pages, but discard membership on query refresh.
		const interrupted = enabled
			? Object.keys( levels ).filter( ( id ) => levels[ id ].isLoading )
			: [];
		for ( const id of interrupted ) {
			levels[ id ] = { ...levels[ id ], isLoading: false };
		}
		stateRef.current = { key: queryKey, levels };
		setState( stateRef.current );
		if ( ! levels.root ) {
			load( null );
		}
		for ( const id of interrupted ) {
			load( id === 'root' ? null : id );
		}
		return () => {
			requests.enabled = false;
			requests.controllers.forEach( ( controller ) =>
				controller.abort()
			);
			requests.controllers.clear();
		};
	}, [ enabled, load, queryKey ] );

	const levels =
		enabled && state.key === queryKey ? state.levels : EMPTY_LEVELS;
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
		getPaginationInfo: ( parentId ) => {
			const level = levels[ parentId ?? 'root' ];
			return level
				? {
						hasMore: level.hasMore,
						remainingItems:
							level.totalItems === undefined
								? undefined
								: Math.max(
										0,
										level.totalItems - level.records.length
									),
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
