/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';

const PUBLISH_ON_SAVE_ENTITIES = [
	{ kind: 'postType', name: 'wp_navigation' },
];

export default function useSaveEntities( {
	onSave,
	entitiesToSkip = [],
	close,
} = {} ) {
	const saveNoticeId = 'site-editor-save-success';
	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );
	const { createSuccessNotice, createErrorNotice, removeNotice } =
		useDispatch( noticesStore );
	const {
		editEntityRecord,
		saveEditedEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );
	const homeUrl = useSelect(
		( select ) => select( coreStore ).getUnstableBase()?.home,
		[]
	);
	const { dirtyEntityRecords } = useSelect( ( select ) => {
		const { __experimentalGetDirtyEntityRecords } = select( coreStore );
		const _dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		return { dirtyEntityRecords: _dirtyEntityRecords };
	}, [] );
	return function () {
		removeNotice( saveNoticeId );
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key, property } ) => {
				return ! entitiesToSkip.some(
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key &&
						elt.property === property
				);
			}
		);
		if ( ! entitiesToSave.length ) {
			return;
		}
		close?.( entitiesToSave );
		const siteItemsToSave = [];
		const pendingSavedRecords = [];
		entitiesToSave.forEach( ( { kind, name, key, property } ) => {
			if ( 'root' === kind && 'site' === name ) {
				siteItemsToSave.push( property );
			} else {
				if (
					PUBLISH_ON_SAVE_ENTITIES.some(
						( typeToPublish ) =>
							typeToPublish.kind === kind &&
							typeToPublish.name === name
					)
				) {
					editEntityRecord( kind, name, key, { status: 'publish' } );
				}

				pendingSavedRecords.push(
					saveEditedEntityRecord( kind, name, key )
				);
			}
		} );
		if ( siteItemsToSave.length ) {
			pendingSavedRecords.push(
				saveSpecifiedEntityEdits(
					'root',
					'site',
					undefined,
					siteItemsToSave
				)
			);
		}
		__unstableMarkLastChangeAsPersistent();
		Promise.all( pendingSavedRecords )
			.then( ( values ) => {
				return onSave ? onSave( values ) : values;
			} )
			.then( ( values ) => {
				if (
					values.some( ( value ) => typeof value === 'undefined' )
				) {
					createErrorNotice( __( 'Saving failed.' ) );
				} else {
					createSuccessNotice( __( 'Site updated.' ), {
						type: 'snackbar',
						id: saveNoticeId,
						actions: [
							{
								label: __( 'View site' ),
								url: homeUrl,
							},
						],
					} );
				}
			} )
			.catch( ( error ) =>
				createErrorNotice( `${ __( 'Saving failed.' ) } ${ error }` )
			);
	};
}
