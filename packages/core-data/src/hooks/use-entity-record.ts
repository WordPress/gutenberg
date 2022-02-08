/**
 * WordPress dependencies
 */
import { useQuerySelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';
import { Status } from './constants';

interface EntityRecordResolution {
	/** The requested entity record */
	record: Object;

	/** The requested entity record with any edits applied*/
	editedRecord: Object;

	/** Is the record still being resolved? */
	isResolving: boolean;

	/** Is the record resolved by now? */
	hasResolved: boolean;

	/** Were there eny edits applied to this entity record? */
	hasEdits: boolean;

	/** Resolution status */
	status: Status;
}

/**
 * Resolves the specified entity record.
 *
 * @param {string} kind     Kind of the deleted entity.
 * @param {string} name     Name of the deleted entity.
 * @param {string} recordId Record ID of the deleted entity.
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
 * @return {EntityRecordResolution} Entity record data.
 */
export default function __experimentalUseEntityRecord( kind, name, recordId ) {
	const {
		data,
		isResolving,
		hasResolved,
		editedRecord,
		hasEdits,
	} = useQuerySelect(
		( query ) => {
			const {
				getEntityRecord,
				getEditedEntityRecord,
				hasEditsForEntityRecord,
			} = query( coreStore );
			const args = [ kind, name, recordId ];
			const recordResponse = getEntityRecord( ...args );
			return {
				...recordResponse,
				editedRecord: getEditedEntityRecord( ...args ).data,
				hasEdits: hasEditsForEntityRecord( ...args ).data,
			};
		},
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
		editedRecord,
		hasEdits,
		isResolving,
		hasResolved,
	};
}
