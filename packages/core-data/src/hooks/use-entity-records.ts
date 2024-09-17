/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';
import deprecated from '@wordpress/deprecated';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useQuerySelect from './use-query-select';
import { store as coreStore } from '../';
import type { Options } from './use-entity-record';
import type { Status } from './constants';
import { unlock } from '../lock-unlock';

interface EntityRecordsResolution< RecordType > {
	/** The requested entity record */
	records: RecordType[] | null;

	/**
	 * Is the record still being resolved?
	 */
	isResolving: boolean;

	/**
	 * Is the record resolved by now?
	 */
	hasResolved: boolean;

	/** Resolution status */
	status: Status;

	/**
	 * The total number of available items (if not paginated).
	 */
	totalItems: number | null;

	/**
	 * The total number of pages.
	 */
	totalPages: number | null;
}

const EMPTY_ARRAY = [];

/**
 * Resolves the specified entity records.
 *
 * @since 6.1.0 Introduced in WordPress core.
 *
 * @param    kind      Kind of the entity, e.g. `root` or a `postType`. See rootEntitiesConfig in ../entities.ts for a list of available kinds.
 * @param    name      Name of the entity, e.g. `plugin` or a `post`. See rootEntitiesConfig in ../entities.ts for a list of available names.
 * @param    queryArgs Optional HTTP query description for how to fetch the data, passed to the requested API endpoint.
 * @param    options   Optional hook options.
 * @example
 * ```js
 * import { useEntityRecords } from '@wordpress/core-data';
 *
 * function PageTitlesList() {
 *   const { records, isResolving } = useEntityRecords( 'postType', 'page' );
 *
 *   if ( isResolving ) {
 *     return 'Loading...';
 *   }
 *
 *   return (
 *     <ul>
 *       {records.map(( page ) => (
 *         <li>{ page.title }</li>
 *       ))}
 *     </ul>
 *   );
 * }
 *
 * // Rendered in the application:
 * // <PageTitlesList />
 * ```
 *
 * In the above example, when `PageTitlesList` is rendered into an
 * application, the list of records and the resolution details will be retrieved from
 * the store state using `getEntityRecords()`, or resolved if missing.
 *
 * @return Entity records data.
 * @template RecordType
 */
export default function useEntityRecords< RecordType >(
	kind: string,
	name: string,
	queryArgs: Record< string, unknown > = {},
	options: Options = { enabled: true }
): EntityRecordsResolution< RecordType > {
	// Serialize queryArgs to a string that can be safely used as a React dep.
	// We can't just pass queryArgs as one of the deps, because if it is passed
	// as an object literal, then it will be a different object on each call even
	// if the values remain the same.
	const queryAsString = addQueryArgs( '', queryArgs );

	const { data: records, ...rest } = useQuerySelect(
		( query ) => {
			if ( ! options.enabled ) {
				return {
					// Avoiding returning a new reference on every execution.
					data: EMPTY_ARRAY,
				};
			}
			return query( coreStore ).getEntityRecords( kind, name, queryArgs );
		},
		[ kind, name, queryAsString, options.enabled ]
	);

	const { totalItems, totalPages } = useSelect(
		( select ) => {
			if ( ! options.enabled ) {
				return {
					totalItems: null,
					totalPages: null,
				};
			}
			return {
				totalItems: select( coreStore ).getEntityRecordsTotalItems(
					kind,
					name,
					queryArgs
				),
				totalPages: select( coreStore ).getEntityRecordsTotalPages(
					kind,
					name,
					queryArgs
				),
			};
		},
		[ kind, name, queryAsString, options.enabled ]
	);

	return {
		records,
		totalItems,
		totalPages,
		...rest,
	};
}

export function __experimentalUseEntityRecords(
	kind: string,
	name: string,
	queryArgs: any,
	options: any
) {
	deprecated( `wp.data.__experimentalUseEntityRecords`, {
		alternative: 'wp.data.useEntityRecords',
		since: '6.1',
	} );
	return useEntityRecords( kind, name, queryArgs, options );
}

export function useEntityRecordsWithPermissions< RecordType >(
	kind: string,
	name: string,
	queryArgs: Record< string, unknown > = {},
	options: Options = { enabled: true }
): EntityRecordsResolution< RecordType > {
	const entityConfig = useSelect(
		( select ) => select( coreStore ).getEntityConfig( kind, name ),
		[ kind, name ]
	);
	const { records: data, ...ret } = useEntityRecords(
		kind,
		name,
		queryArgs,
		options
	);
	const ids = useMemo(
		() =>
			data?.map(
				// @ts-ignore
				( record: RecordType ) => record[ entityConfig?.key ?? 'id' ]
			) ?? [],
		[ data, entityConfig?.key ]
	);

	const permissions = useSelect(
		( select ) => {
			const { getEntityRecordsPermissions } = unlock(
				select( coreStore )
			);
			return getEntityRecordsPermissions( kind, name, ids );
		},
		[ ids, kind, name ]
	);

	const dataWithPermissions = useMemo(
		() =>
			data?.map( ( record, index ) => ( {
				// @ts-ignore
				...record,
				permissions: permissions[ index ],
			} ) ) ?? [],
		[ data, permissions ]
	);

	return { records: dataWithPermissions, ...ret };
}
