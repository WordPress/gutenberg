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
		const recordId = getRecordId( entity, record );
		let edits = record;
		if ( entity.__unstablePrePersist ) {
			edits = {
				...edits,
				...entity.__unstablePrePersist( persistedRecord, edits ),
			};
		}
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
	__unstableFetch = triggerFetch,
	__prepareAutosaveRequest = prepareAutosaveRequest,
	__reconcileAutosave = reconcileAutosave,
} ) {
	return async ( { select, dispatch } ) => {
		const recordId = getRecordId( entity, record );
		// Most of this autosave logic is very specific to posts.
		// This is fine for now as it is the only supported autosave,
		// but ideally this should all be handled in the back end,
		// so the client just sends and receives objects.
		const autosavePost = select.getAutosave(
			persistedRecord.type,
			persistedRecord.id,
			select.getCurrentUser()?.id
		);

		// Autosaves need all expected fields to be present.
		// So we fallback to the previous autosave and then
		// to the actual persisted entity if the edits don't
		// have a value.
		const requestData = __prepareAutosaveRequest( {
			...persistedRecord,
			...autosavePost,
			...record,
		} );

		const path = entityEndpointPath( entity, recordId );
		const updatedRecord = await __unstableFetch( {
			path: `${ path }/autosaves`,
			method: 'POST',
			data: requestData,
		} );

		// An autosave may be processed by the server as a regular save
		// when its update is requested by the author and the post had
		// draft or auto-draft status.
		const processedAsRegularSave = persistedRecord.id === updatedRecord.id;
		const reconciledRecord = __reconcileAutosave
			? __reconcileAutosave(
					persistedRecord,
					requestData,
					updatedRecord,
					{ processedAsRegularSave }
			  )
			: updatedRecord;

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

export function prepareAutosaveRequest( { title, excerpt, content, status } ) {
	return {
		title,
		excerpt,
		content,
		status: status === 'auto-draft' ? 'draft' : status,
	};
}

export function reconcileAutosave(
	persistedRecord,
	requestData,
	updatedRecord,
	{ processedAsRegularSave }
) {
	return processedAsRegularSave
		? {
				...persistedRecord,

				title: updatedRecord.title,
				excerpt: updatedRecord.excerpt,
				content: updatedRecord.content,

				// Status is only persisted in autosaves when going from
				// "auto-draft" to "draft".
				status:
					persistedRecord.status === 'auto-draft' &&
					requestData.status === 'draft'
						? requestData.status
						: persistedRecord.status,
		  }
		: updatedRecord;
}
