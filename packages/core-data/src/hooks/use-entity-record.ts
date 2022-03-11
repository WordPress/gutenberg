/**
 * Internal dependencies
 */
import useQuerySelect from './use-query-select';
import { store as coreStore } from '../';
import { Status } from './constants';

interface EntityRecordResolution< RecordType > {
	/** The requested entity record */
	record: RecordType | null;

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
	__experimentalExecute: boolean;
}

/**
 * Resolves the specified entity record.
 *
 * @param  kind     Kind of the requested entity.
 * @param  name     Name of the requested  entity.
 * @param  recordId Record ID of the requested entity.
 *
 * @param  options
 * @example
 * ```js
 * import { useEntityRecord } from '@wordpress/core-data';
 *
 * function PageTitleDisplay( { id } ) {
 *   const { record, isResolving } = useEntityRecord( 'postType', 'page', id );
 *
 *   if ( isResolving ) {
 *     return 'Loading...';
 *   }
 *
 *   return record.title;
 * }
 *
 * // Rendered in the application:
 * // <PageTitleDisplay id={ 1 } />
 * ```
 *
 * In the above example, when `PageTitleDisplay` is rendered into an
 * application, the page and the resolution details will be retrieved from
 * the store state using `getEntityRecord()`, or resolved if missing.
 *
 * @return {EntityRecordResolution<RecordType>} Entity record data.
 * @template RecordType
 */
export default function __experimentalUseEntityRecord< RecordType >(
	kind: string,
	name: string,
	recordId: string | number,
	options: Options = { __experimentalExecute: true }
): EntityRecordResolution< RecordType > {
	const { data: record, ...rest } = useQuerySelect(
		( query ) => {
			if ( ! options.__experimentalExecute ) {
				return null;
			}
			return query( coreStore ).getEntityRecord( kind, name, recordId );
		},
		[ kind, name, recordId, options.__experimentalExecute ]
	);

	return {
		record,
		...rest,
	};
}
