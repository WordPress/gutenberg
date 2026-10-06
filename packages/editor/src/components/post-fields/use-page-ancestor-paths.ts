import apiFetch from '@wordpress/api-fetch';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

type Page = {
	id: number;
	parent?: number;
	title?: string | { rendered?: string; raw?: string };
};

type Result = {
	key: string;
	paths: Record< number, string[] >;
	error?: string;
	loading?: boolean;
};

function titleOf( page: Page ) {
	const title =
		typeof page.title === 'string'
			? page.title
			: ( page.title?.rendered ?? page.title?.raw ?? '' );
	return typeof title === 'string'
		? stripHTML( decodeEntities( title ) ) || __( '(no title)' )
		: __( '(no title)' );
}

/**
 * Resolve only the ancestors of visible search results, one batch per depth.
 *
 * @param records Visible page records.
 * @param enabled Whether the list is a Pages table search.
 */
export default function usePageAncestorPaths(
	records: Page[] | undefined,
	enabled: boolean
) {
	const key = JSON.stringify(
		enabled
			? ( records?.map( ( { id, parent, title } ) => ( {
					id,
					parent,
					title,
				} ) ) ?? [] )
			: null
	);
	const [ result, setResult ] = useState< Result >( { key: '', paths: {} } );
	useEffect( () => {
		// The key is our own serialized snapshot: record identity can change
		// independently of its content when permissions resolve.
		const visible = JSON.parse( key ) as Page[] | null;
		if ( ! enabled || ! visible?.length ) {
			return;
		}
		const visiblePages = visible;
		const controller = new AbortController();
		const pages = new Map( visible.map( ( page ) => [ page.id, page ] ) );

		async function resolve() {
			try {
				const visited = new Set< number >();
				let parents = new Set(
					visiblePages
						.map( ( page ) => page.parent )
						.filter( ( id ): id is number => !! id )
				);
				while ( parents.size ) {
					const level = [ ...parents ].filter(
						( id ) => ! visited.has( id )
					);
					level.forEach( ( id ) => visited.add( id ) );
					const ids = level.filter( ( id ) => ! pages.has( id ) );
					const batches = [];
					for ( let i = 0; i < ids.length; i += 100 ) {
						batches.push(
							apiFetch( {
								path: addQueryArgs( '/wp/v2/pages', {
									context: 'edit',
									status: 'any',
									include: ids
										.slice( i, i + 100 )
										.join( ',' ),
									per_page: Math.min( 100, ids.length - i ),
									_fields: 'id,parent,title',
								} ),
								signal: controller.signal,
							} )
						);
					}
					const responses = await Promise.all( batches );
					parents = new Set();
					for ( const response of responses ) {
						if ( ! Array.isArray( response ) ) {
							throw new Error( __( 'Invalid page response.' ) );
						}
						for ( const page of response as Page[] ) {
							if ( typeof page?.id !== 'number' ) {
								continue;
							}
							if ( typeof page.parent !== 'number' ) {
								continue;
							}
							pages.set( page.id, page );
						}
					}
					parents = new Set(
						level
							.map( ( id ) => pages.get( id )?.parent )
							.filter(
								( id ): id is number =>
									!! id && ! visited.has( id )
							)
					);
				}
				const paths: Result[ 'paths' ] = {};
				for ( const record of visiblePages ) {
					const path: string[] = [];
					const seen = new Set( [ record.id ] );
					let parent = record.parent;
					while (
						parent &&
						pages.has( parent ) &&
						! seen.has( parent )
					) {
						seen.add( parent );
						const page = pages.get( parent )!;
						path.unshift( titleOf( page ) );
						parent = page.parent;
					}
					if ( ! parent ) {
						paths[ record.id ] = path;
					}
				}
				if ( ! controller.signal.aborted ) {
					setResult( { key, paths } );
				}
			} catch ( error ) {
				if ( ! controller.signal.aborted ) {
					setResult( {
						key,
						paths: {},
						error:
							typeof ( error as { message?: unknown } )
								?.message === 'string'
								? stripHTML(
										( error as { message: string } ).message
									)
								: __(
										'Could not load page locations. Try again.'
									),
					} );
				}
			}
		}
		resolve();
		return () => controller.abort();
	}, [ key, enabled ] );

	return result.key === key
		? result
		: { key, paths: {}, loading: enabled && !! records?.length };
}
