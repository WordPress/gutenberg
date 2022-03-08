/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import useQuerySelect from './use-query-select';
import { store as coreStore } from '../';
import { Status } from './constants';

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
}

interface Options {
	execute: boolean;
}

/**
 * Resolves the specified entity records.
 *
 * @param  kind      Kind of the requested entities.
 * @param  name      Name of the requested entities.
 * @param  queryArgs HTTP query for the requested entities.
 * @param  options
 * @example
 * ```js
 * import { useEntityRecord } from '@wordpress/core-data';
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
 * @return {EntityRecordsResolution<RecordType>} Entity records data.
 * @template RecordType
 */
export default function __experimentalUseEntityRecords< RecordType >(
	kind: string,
	name: string,
	queryArgs: unknown = {},
	options: Options = { execute: true }
): EntityRecordsResolution< RecordType > {
	// Serialize queryArgs to a string that can be safely used as a React dep.
	// We can't just pass queryArgs as one of the deps, because if it is passed
	// as an object literal, then it will be a different object on each call even
	// if the values remain the same.
	const queryAsString = addQueryArgs( '', queryArgs );

	const { data: records, ...rest } = useQuerySelect(
		( query ) => {
			if ( options.execute ) {
				return query( coreStore ).getEntityRecords(
					kind,
					name,
					queryArgs
				);
			}
		},
		[ kind, name, queryAsString, options.execute ]
	);

	return {
		records,
		...rest,
	};
}
