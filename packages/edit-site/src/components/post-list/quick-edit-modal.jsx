import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import {
	Button,
	Modal,
	Popover,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { createPortal, useEffect, useMemo, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '../../lock-unlock';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [
	'status',
	'date',
	'author',
	'discussion',
	'template',
	'parent',
];

export function QuickEditModal( {
	postType,
	postId,
	closeModal,
	quickEditForm,
} ) {
	const isBulk = postId.length > 1;

	const [ modalElement, setModalElement ] = useState( null );
	const [ localEdits, setLocalEdits ] = useState( {} );
	const { record, hasFinishedResolution, frontPageId, postsPageId } =
		useSelect(
			( select ) => {
				const {
					getEditedEntityRecord,
					getHomePage,
					getPostsPageId,
					hasFinishedResolution: hasFinished,
				} = unlock( select( coreDataStore ) );
				// The front page and the posts page take their template from
				// the reading settings.
				const pageIds = {
					frontPageId:
						postType === 'page' ? getHomePage()?.postId : undefined,
					postsPageId: getPostsPageId(),
				};

				if ( isBulk ) {
					return {
						...pageIds,
						record: null,
						hasFinishedResolution: true,
					};
				}

				const args = [ 'postType', postType, postId[ 0 ] ];

				return {
					...pageIds,
					record: getEditedEntityRecord( ...args ),
					hasFinishedResolution: hasFinished(
						'getEditedEntityRecord',
						args
					),
				};
			},
			[ postType, postId, isBulk ]
		);
	const canSwitchTemplateOf = ( id ) =>
		String( id ) !== postsPageId && String( id ) !== frontPageId;
	const canSwitchTemplate = postId.some( canSwitchTemplateOf );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreDataStore );

	const _fields = usePostFields( { postType } );
	const fields = useMemo(
		() =>
			_fields?.map( ( field ) => {
				if ( field.id === 'status' ) {
					return {
						...field,
						elements: field.elements.filter(
							( element ) => element.value !== 'trash'
						),
					};
				}

				if ( field.id === 'template' ) {
					return {
						...field,
						readOnly: ! canSwitchTemplate,
					};
				}

				return field;
			} ),
		[ _fields, canSwitchTemplate ]
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
			const edits = { ...localEdits };
			if ( ! canSwitchTemplateOf( id ) ) {
				delete edits.template;
			}
			// Picking one of the selected pages as the parent makes it the
			// parent of the others.
			if ( String( edits.parent ) === String( id ) ) {
				delete edits.parent;
			}
			editEntityRecord( 'postType', postType, id, edits );
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
			ref={ setModalElement }
			size="small"
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
						// Several posts have no record: the fields still need
						// the post type.
						data={ { type: postType, ...record, ...localEdits } }
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
			{ modalElement &&
				// Keep popovers inside modal isolation but outside the clipped frame.
				createPortal( <Popover.Slot />, modalElement ) }
		</Modal>
	);
}
