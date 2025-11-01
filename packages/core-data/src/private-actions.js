/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';

/**
 * Returns an action object used in signalling that the registered post meta
 * fields for a post type have been received.
 *
 * @param {string} postType           Post type slug.
 * @param {Object} registeredPostMeta Registered post meta.
 *
 * @return {Object} Action object.
 */
export function receiveRegisteredPostMeta( postType, registeredPostMeta ) {
	return {
		type: 'RECEIVE_REGISTERED_POST_META',
		postType,
		registeredPostMeta,
	};
}

/**
 * @typedef {Object} Modifier
 * @property {string} [type] - The type of modifier.
 * @property {Object} [args] - The arguments of the modifier.
 */

/**
 * @typedef {Object} Edits
 * @property {string}     [src]       - The URL of the media item.
 * @property {Modifier[]} [modifiers] - The modifiers to apply to the media item.
 */

/**
 * Duplicates a media (attachment) entity record and, optionally, modifies it.
 *
 * @param {string}   recordId                Entity record ID.
 * @param {Edits}    edits                   Edits to apply to the record.
 * @param {Object}   options                 Options object.
 * @param {Function} options.__unstableFetch Custom fetch function.
 * @param {boolean}  options.throwOnError    Whether to throw an error if the request fails.
 *
 * @return {Promise} Promise resolving to the updated record.
 */
export const editMediaEntity =
	(
		recordId,
		edits = {},
		{ __unstableFetch = apiFetch, throwOnError = false } = {}
	) =>
	async ( { dispatch, resolveSelect } ) => {
		if ( ! recordId ) {
			return;
		}

		const kind = 'postType';
		const name = 'attachment';

		const configs = await resolveSelect.getEntitiesConfig( kind );
		const entityConfig = configs.find(
			( config ) => config.kind === kind && config.name === name
		);

		if ( ! entityConfig ) {
			return;
		}

		const lock = await dispatch.__unstableAcquireStoreLock(
			STORE_NAME,
			[ 'entities', 'records', kind, name, recordId ],
			{ exclusive: true }
		);

		let updatedRecord;
		let error;
		let hasError = false;

		try {
			dispatch( {
				type: 'SAVE_ENTITY_RECORD_START',
				kind,
				name,
				recordId,
			} );

			try {
				const path = `${ entityConfig.baseURL }/${ recordId }/edit`;
				const newRecord = await __unstableFetch( {
					path,
					method: 'POST',
					data: {
						...edits,
					},
				} );

				if ( newRecord ) {
					dispatch.receiveEntityRecords(
						kind,
						name,
						[ newRecord ],
						undefined,
						true,
						undefined,
						undefined
					);
					updatedRecord = newRecord;
				}
			} catch ( e ) {
				error = e;
				hasError = true;
			}

			dispatch( {
				type: 'SAVE_ENTITY_RECORD_FINISH',
				kind,
				name,
				recordId,
				error,
			} );

			if ( hasError && throwOnError ) {
				throw error;
			}
			return updatedRecord;
		} finally {
			dispatch.__unstableReleaseStoreLock( lock );
		}
	};
