/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import useQuerySelect from './use-query-select';
import { store as coreStore } from '../';
import type { Status } from './constants';
import useEntityRecords from './use-entity-records';

export interface EntityRecordResolution< RecordType > {
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

export interface Options {
	/**
	 * Whether to run the query or short-circuit and return null.
	 *
	 * @default true
	 */
	enabled: boolean;
}

/**
 * Resolves the specified entity record.
 *
 * @param  kind     Kind of the entity, e.g. `root` or a `postType`. See rootEntitiesConfig in ../entities.ts for a list of available kinds.
 * @param  name     Name of the entity, e.g. `plugin` or a `post`. See rootEntitiesConfig in ../entities.ts for a list of available names.
 * @param  recordId ID of the requested entity record.
 * @param  options  Optional hook options.
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
 * @return Entity record data.
 * @template RecordType
 */
export default function useEntityRecord< RecordType >(
	kind: string,
	name: string,
	recordId: string | number,
	options: Options = { enabled: true }
): EntityRecordResolution< RecordType > {
	const { data: record, ...rest } = useQuerySelect(
		( query ) => {
			if ( ! options.enabled ) {
				return null;
			}
			return query( coreStore ).getEntityRecord( kind, name, recordId );
		},
		[ kind, name, recordId, options.enabled ]
	);

	return {
		record,
		...rest,
	};
}

export function __experimentalUseEntityRecord(
	kind: string,
	name: string,
	recordId: any,
	options: any
) {
	deprecated( `wp.data.__experimentalUseEntityRecord`, {
		alternative: 'wp.data.useEntityRecord',
		since: '6.1',
	} );
	return useEntityRecord( kind, name, recordId, options );
}
