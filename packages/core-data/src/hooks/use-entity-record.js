/**
 * WordPress dependencies
 */
import { useQuerySelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';
import { IDLE, SUCCESS, ERROR, RESOLVING } from './constants';

/**
 * @typedef {IDLE|RESOLVING|SUCCESS|ERROR} EntityRecordStatus
 */

/**
 * @typedef {Object} EntityRecordResolution
 * @property {Object}             record       the requested entity record
 * @property {Object}             editedRecord the requested entity record with any edits applied
 * @property {boolean}            isMissing    is the record missing after the resolver has finished?
 * @property {boolean}            isResolving  is the record still being resolved?
 * @property {boolean}            hasResolved  is the record resolved by now?
 * @property {boolean}            hasEdits     were there eny edits applied to this entity record?
 * @property {EntityRecordStatus} status       resolution status
 */

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
 * function HammerPriceDisplay( { hammerId } ) {
 *   const { record, isResolving } = useEntityRecord( 'my-shop', 'hammer', hammerId );
 *
 *   if ( isResolving ) {
 *     return 'Loading...';
 *   }
 *
 *   return new Intl.NumberFormat( 'en-US', {
 *     style: 'USD',
 *     currency,
 *   } ).format( record.price );
 * }
 *
 * // Rendered in the application:
 * // <HammerPriceDisplay hammerId={ 1 } />
 * ```
 *
 * In the above example, when `HammerPriceDisplay` is rendered into an
 * application, the price and the resolution details will be retrieved from
 * the store state using `getEntityRecord()`, or resolved if missing.
 *
 * @return {EntityRecordResolution} Entity record data.
 */
export default function useEntityRecord( kind, name, recordId ) {
	const {
		data,
		isMissing,
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
				isMissing: recordResponse.hasResolved && ! recordResponse.data,
				editedRecord: getEditedEntityRecord( ...args ).data,
				hasEdits: hasEditsForEntityRecord( ...args ).data,
			};
		},
		[ kind, name, recordId ]
	);

	let status;
	if ( isResolving ) {
		status = RESOLVING;
	} else if ( hasResolved ) {
		if ( data ) {
			status = SUCCESS;
		} else {
			status = ERROR;
		}
	} else {
		status = IDLE;
	}

	return {
		status,
		record: data,
		editedRecord,
		hasEdits,
		isMissing,
		isResolving,
		hasResolved,
	};
}
