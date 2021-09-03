/**
 * External dependencies
 */
import { identity } from 'lodash';

/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { getRecordId } from './utils';

const entityEndpointPath = ( entity, recordId ) =>
	`${ entity.baseURL }${ recordId ? '/' + recordId : '' }`;

export function persistRecordToAPI( {
	entity,
	persistedRecord,
	record,
	__unstableFetch = triggerFetch,
} ) {
	return async ( { dispatch } ) => {
		let edits = record;
		if ( entity.__unstablePrePersist ) {
			edits = {
				...edits,
				...entity.__unstablePrePersist( persistedRecord, edits ),
			};
		}
		const recordId = getRecordId( entity, record );
		const options = {
			path: entityEndpointPath( entity, recordId ),
			method: recordId ? 'PUT' : 'POST',
			data: edits,
		};
		const updatedRecord = await __unstableFetch( options );
		await dispatch.receiveEntityRecords(
			entity.kind,
			entity.name,
			updatedRecord,
			undefined,
			true,
			edits
		);
		return updatedRecord;
	};
}

export function persistAutosaveToAPI( {
	entity,
	persistedRecord,
	record,
	prepareAutosaveRequest = identity,
	reconcileAutosaveResponse = identity,
	__unstableFetch = triggerFetch,
} ) {
	return async ( { select, dispatch } ) => {
		const autosavePost = select.getAutosave(
			persistedRecord.type,
			persistedRecord.id,
			select.getCurrentUser()?.id
		);

		// Autosaves need all expected fields to be present.
		// So we fallback to the previous autosave and then
		// to the actual persisted entity if the edits don't
		// have a value.
		const requestData = prepareAutosaveRequest( {
			...persistedRecord,
			...autosavePost,
			...record,
		} );

		const recordId = getRecordId( entity, record );
		const path = entityEndpointPath( entity, recordId );
		const updatedRecord = await __unstableFetch( {
			path: `${ path }/autosaves`,
			method: 'POST',
			data: requestData,
		} );

		// An autosave may be processed by the server as a regular save.
		const processedAsRegularSave = persistedRecord.id === updatedRecord.id;
		const reconciledRecord = reconcileAutosaveResponse(
			updatedRecord,
			requestData,
			persistedRecord,
			{ processedAsRegularSave }
		);

		if ( processedAsRegularSave ) {
			await dispatch.receiveEntityRecords(
				entity.kind,
				entity.name,
				reconciledRecord,
				undefined,
				true
			);
		} else {
			await dispatch.receiveAutosaves(
				persistedRecord.id,
				reconciledRecord
			);
		}

		return updatedRecord;
	};
}
