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

/**
 * Resolves the specified entity record.
 *
 * @param  kind      Kind of the requested entity.
 * @param  name      Name of the requested  entity.
 * @param  httpQuery HTTP query for the requested entities.
 *
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
 * @return {EntityRecordsResolution<RecordType>} Entity record data.
 * @template RecordType
 */
export default function __experimentalUseEntityRecords< RecordType >(
	kind: string,
	name: string,
	httpQuery: unknown = {}
): EntityRecordsResolution< RecordType > {
	const { data: records, ...rest } = useQuerySelect(
		( query ) => query( coreStore ).getEntityRecords( kind, name, httpQuery ),
		[ kind, name, httpQuery ]
	);

	return {
		records,
		...rest,
	};
}
