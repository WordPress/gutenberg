/**
 * WordPress dependencies
 */
import { useQuerySelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';
import { Status } from './constants';

interface EntityRecordResolution< RecordType > {
	/** The requested entity record */
	record: RecordType | null;

	/**
	 * Is the record still being resolved?
	 *
	 * Note that isResolving and hasResolved may both be true when the entity record is being re-requested.
	 */
	isResolving: boolean;

	/**
	 * Is the record resolved by now?
	 *
	 * Note that isResolving and hasResolved may both be true when the entity record is being re-requested.
	 */
	hasResolved: boolean;

	/** Resolution status */
	status: Status;
}

/**
 * Resolves the specified entity record.
 *
 * @param {string} kind     Kind of the requested entity.
 * @param {string} name     Name of the requested  entity.
 * @param {string} recordId Record ID of the requested entity.
 *
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
 * application, the price and the resolution details will be retrieved from
 * the store state using `getEntityRecord()`, or resolved if missing.
 *
 * @return {EntityRecordResolution<RecordType>} Entity record data.
 * @template RecordType
 */
export default function __experimentalUseEntityRecord< RecordType >(
	kind,
	name,
	recordId
): EntityRecordResolution< RecordType > {
	const { data, isResolving, hasResolved } = useQuerySelect(
		( query ) => query( coreStore ).getEntityRecord( kind, name, recordId ),
		[ kind, name, recordId ]
	);

	let status;
	if ( isResolving ) {
		status = Status.Resolving;
	} else if ( hasResolved ) {
		if ( data ) {
			status = Status.Success;
		} else {
			status = Status.Error;
		}
	} else {
		status = Status.Idle;
	}

	return {
		status,
		record: data,
		isResolving,
		hasResolved,
	};
}
