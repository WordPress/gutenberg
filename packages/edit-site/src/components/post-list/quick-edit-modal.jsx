import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '../../lock-unlock';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [ 'status', 'date', 'author', 'discussion' ];

// The record keys each bulk-editable field's summary reads. Bulk edit starts
// from an empty record, so until the user edits a field there is no value to
// summarize and rendering one would invent it: `date` would show the current
// time and `discussion` would report "Closed".
const bulkSummaryKeys = {
	status: [ 'status' ],
	date: [ 'date' ],
	author: [ 'author' ],
	discussion: [ 'comment_status', 'ping_status' ],
};

function withBulkSummary( field ) {
	const keys = bulkSummaryKeys[ field.id ];
	// A field with no `render` of its own falls back to the one its type
	// provides, which already renders nothing for an absent value.
	if ( ! keys || ! field.render ) {
		return field;
	}
	const Summary = field.render;
	const BulkSummary = ( props ) =>
		keys.some( ( key ) => key in props.item ) ? (
			<Summary { ...props } />
		) : (
			__( 'No change' )
		);
	BulkSummary.displayName = `BulkSummary(${ field.id })`;
	return { ...field, render: BulkSummary };
}

export function QuickEditModal( {
	postType,
	postId,
	closeModal,
	quickEditForm,
} ) {
	const isBulk = postId.length > 1;

	const [ localEdits, setLocalEdits ] = useState( {} );
	const { record, hasFinishedResolution, canSwitchTemplate } = useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				hasFinishedResolution: hasFinished,
			} = select( coreDataStore );

			if ( isBulk ) {
				return {
					record: null,
					hasFinishedResolution: true,
				};
			}

			const args = [ 'postType', postType, postId[ 0 ] ];

			const { getHomePage, getPostsPageId } = unlock(
				select( coreDataStore )
			);
			const singlePostId = String( postId[ 0 ] );
			const isPostsPage =
				singlePostId !== undefined && getPostsPageId() === singlePostId;
			const isFrontPage =
				singlePostId !== undefined &&
				postType === 'page' &&
				getHomePage()?.postId === singlePostId;

			return {
				record: getEditedEntityRecord( ...args ),
				hasFinishedResolution: hasFinished(
					'getEditedEntityRecord',
					args
				),
				canSwitchTemplate: ! isPostsPage && ! isFrontPage,
			};
		},
		[ postType, postId, isBulk ]
	);
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreDataStore );

	const _fields = usePostFields( { postType } );
	const fields = useMemo(
		() =>
			_fields?.map( ( field ) => {
				let nextField = field;

				if ( field.id === 'status' ) {
					nextField = {
						...field,
						elements: field.elements.filter(
							( element ) => element.value !== 'trash'
						),
					};
				} else if ( field.id === 'template' ) {
					nextField = {
						...field,
						readOnly: ! canSwitchTemplate,
					};
				}

				return isBulk ? withBulkSummary( nextField ) : nextField;
			} ),
		[ _fields, canSwitchTemplate, isBulk ]
	);

	const form = useMemo( () => {
		if ( ! quickEditForm ) {
			return { layout: { type: 'panel' }, fields: [] };
		}
		if ( ! isBulk ) {
			return quickEditForm;
		}
		return {
			...quickEditForm,
			fields: ( quickEditForm.fields ?? [] ).filter( ( field ) =>
				fieldsWithBulkEditSupport.includes(
					typeof field === 'string' ? field : field.id
				)
			),
		};
	}, [ isBulk, quickEditForm ] );

	const onChange = ( edits ) => {
		const currentData = { ...record, ...localEdits };

		if (
			edits.status &&
			edits.status !== 'future' &&
			currentData?.status === 'future' &&
			new Date( currentData.date ) > new Date()
		) {
			edits.date = null;
		}
		if (
			edits.status &&
			edits.status === 'private' &&
			currentData?.password
		) {
			edits.password = '';
		}

		setLocalEdits( ( prev ) => ( { ...prev, ...edits } ) );
	};
	useEffect( () => {
		setLocalEdits( {} );
	}, [ postId ] );

	const onSave = async () => {
		for ( const id of postId ) {
			editEntityRecord( 'postType', postType, id, localEdits );
		}

		if ( isBulk ) {
			await Promise.allSettled(
				postId.map( ( id ) =>
					saveEditedEntityRecord( 'postType', postType, id )
				)
			);
		} else {
			await saveEditedEntityRecord( 'postType', postType, postId[ 0 ] );
		}
		closeModal?.();
	};

	return (
		<Modal
			overlayClassName="dataviews-action-modal__quick-edit"
			__experimentalHideHeader
			onRequestClose={ closeModal }
			focusOnMount="firstElement"
		>
			<div className="dataviews-action-modal__quick-edit-header">
				<PostCardPanel
					postType={ postType }
					postId={ postId }
					hideActions
				/>
			</div>
			<div className="dataviews-action-modal__quick-edit-content">
				{ hasFinishedResolution && (
					<DataForm
						data={ { ...record, ...localEdits } }
						fields={ fields }
						form={ form }
						onChange={ onChange }
					/>
				) }
			</div>
			<HStack className="dataviews-action-modal__quick-edit-footer">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ closeModal }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ onSave }
				>
					{ __( 'Done' ) }
				</Button>
			</HStack>
		</Modal>
	);
}
