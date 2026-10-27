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
import { StatusSelectEdit } from './status-select-edit';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [ 'status', 'date', 'author', 'discussion' ];

/*
 * Opening the modal is already the choice to edit, so the frequently edited
 * fields render their controls inline rather than behind a panel, and the
 * fields that keep one are pinned below them, above the modal's buttons. A
 * group among them (`status`) is split into its members, so each renders as
 * a field of its own. The form config is shared with the editor's document
 * sidebar, which keeps its panels.
 */
const fieldsWithRegularLayout = [
	'status',
	'slug',
	'author',
	'template',
	'excerpt',
];

const regularLayout = {
	type: 'regular',
	labelPosition: 'top',
};

function splitQuickEditForm( form ) {
	const formFields = ( form.fields ?? [] ).flatMap( ( field ) => {
		const id = typeof field === 'string' ? field : field.id;
		if ( ! fieldsWithRegularLayout.includes( id ) ) {
			return [ field ];
		}
		const members =
			typeof field !== 'string' && field.children
				? field.children
				: [ field ];
		return members.map( ( member ) => ( {
			...( typeof member === 'string' ? { id: member } : member ),
			layout: regularLayout,
		} ) );
	} );
	const isRegular = ( field ) =>
		( typeof field === 'string'
			? form.layout
			: ( field.layout ?? form.layout )
		)?.type === 'regular';
	return {
		inlineForm: { ...form, fields: formFields.filter( isRegular ) },
		panelForm: {
			...form,
			fields: formFields.filter( ( field ) => ! isRegular( field ) ),
		},
	};
}

export function QuickEditModal( {
	postType,
	postId,
	closeModal,
	quickEditForm,
} ) {
	const isBulk = postId.length > 1;

	const [ modalElement, setModalElement ] = useState( null );
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
				if ( field.id === 'status' ) {
					return {
						...field,
						Edit: StatusSelectEdit,
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

	const { inlineForm, panelForm } = useMemo( () => {
		if ( ! quickEditForm ) {
			const emptyForm = { layout: { type: 'panel' }, fields: [] };
			return { inlineForm: emptyForm, panelForm: emptyForm };
		}
		const formFields = isBulk
			? ( quickEditForm.fields ?? [] ).filter( ( field ) =>
					fieldsWithBulkEditSupport.includes(
						typeof field === 'string' ? field : field.id
					)
				)
			: quickEditForm.fields;
		return splitQuickEditForm( { ...quickEditForm, fields: formFields } );
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
						data={ { ...record, ...localEdits } }
						fields={ fields }
						form={ inlineForm }
						onChange={ onChange }
					/>
				) }
			</div>
			{ hasFinishedResolution && !! panelForm.fields?.length && (
				<div className="dataviews-action-modal__quick-edit-panels">
					<DataForm
						data={ { ...record, ...localEdits } }
						fields={ fields }
						form={ panelForm }
						onChange={ onChange }
					/>
				</div>
			) }
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
