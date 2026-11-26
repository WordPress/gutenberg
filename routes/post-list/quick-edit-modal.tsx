import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form, NormalizedField } from '@wordpress/dataviews';
import {
	Button,
	Modal,
	Popover as WCPopover,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { createPortal, useEffect, useMemo, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { loadEditorAssets } from '@wordpress/lazy-editor';
import { inertValue } from '@wordpress/react-inert-value';
import { unlock } from '@wordpress/routes-lock-unlock';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

/*
 * The featured image field opens the WordPress media modal, which needs the
 * media assets (`wp.media` and friends) that the editor canvas loads but this
 * screen never does — without them, opening the field crashes the route.
 * Wrap the field's edit component so the shared editor assets are loaded
 * first.
 *
 * This is a stopgap owned by the route because the route is what knows the
 * screen is asset-less. Ultimately a field should be able to declare this
 * kind of asset dependency itself so every DataForm consumer gets it for
 * free; once that exists, remove this wrapper.
 */
function withEditorAssets( FieldEdit: any ) {
	return function EditWithEditorAssets( props: any ) {
		const [ isReady, setIsReady ] = useState(
			() => !! ( window as any ).wp?.media
		);
		useEffect( () => {
			if ( ! isReady ) {
				loadEditorAssets().then( () => setIsReady( true ) );
			}
		}, [ isReady ] );

		// Render the field right away — only opening the modal needs the
		// assets — and keep it inert until they have loaded.
		return (
			<div
				aria-busy={ ! isReady || undefined }
				style={ ! isReady ? { opacity: 0.6 } : undefined }
				inert={ inertValue( ! isReady ) }
			>
				<FieldEdit { ...props } />
			</div>
		);
	};
}

const fieldsWithBulkEditSupport = [
	'status',
	'date',
	'author',
	'discussion',
	'template',
	'parent',
];

const EMPTY_ARRAY: string[] = [];

/**
 * Whether the field is disabled for the post.
 *
 * @param field The field.
 * @param item  The post.
 * @return Whether the field is disabled.
 */
function isFieldDisabled< Item >( field: Field< Item >, item: Item ) {
	const { isDisabled } = field;
	return typeof isDisabled === 'function'
		? isDisabled( { item, field: field as NormalizedField< Item > } )
		: !! isDisabled;
}

interface QuickEditModalProps {
	postType: string;
	postId: string[];
	closeModal: () => void;
	/** Called once the edits are saved, before the modal closes. */
	onSave?: () => void;
	quickEditForm: Form | undefined;
}

export function QuickEditModal( {
	postType,
	postId,
	closeModal,
	onSave: onSaved,
	quickEditForm,
}: QuickEditModalProps ) {
	const isBulk = postId.length > 1;

	const [ modalElement, setModalElement ] = useState< HTMLDivElement | null >(
		null
	);
	const [ localEdits, setLocalEdits ] = useState< Record< string, any > >(
		{}
	);
	const { record, hasFinishedResolution } = useSelect(
		( select ) => {
			const store = select( coreDataStore );
			const { getEditedEntityRecord } = store;

			if ( isBulk ) {
				return {
					record: null,
					hasFinishedResolution: true,
				};
			}

			const args = [ 'postType', postType, postId[ 0 ] ] as const;

			return {
				record: getEditedEntityRecord( ...args ),
				hasFinishedResolution: ( store as any ).hasFinishedResolution(
					'getEditedEntityRecord',
					args
				),
			};
		},
		[ postType, postId, isBulk ]
	);
	// The posts being edited, which the list has already loaded.
	const records = useSelect(
		( select ) =>
			postId.map( ( id ) =>
				select( coreDataStore ).getEditedEntityRecord(
					'postType',
					postType,
					id
				)
			),
		[ postType, postId ]
	);
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreDataStore );

	const _fields = usePostFields( { postType } );
	// The form of several posts has no id to tell whether a field is
	// disabled, so ask each post instead.
	const fieldsDisabledForAll = useSelect(
		() =>
			isBulk
				? ( _fields ?? [] )
						.filter( ( field: Field< any > ) =>
							records.every(
								( post ) =>
									!! post && isFieldDisabled( field, post )
							)
						)
						.map( ( field: Field< any > ) => field.id )
				: EMPTY_ARRAY,
		[ _fields, records, isBulk ]
	);
	const fields = useMemo(
		() =>
			_fields?.map( ( field: any ) => {
				if ( fieldsDisabledForAll.includes( field.id ) ) {
					field = { ...field, readOnly: true };
				}

				if ( field.id === 'status' ) {
					return {
						...field,
						elements: field.elements.filter(
							( element: { value: string } ) =>
								element.value !== 'trash'
						),
					};
				}

				if ( field.id === 'featured_media' && field.Edit ) {
					return {
						...field,
						Edit: withEditorAssets( field.Edit ),
					};
				}

				return field;
			} ),
		[ _fields, fieldsDisabledForAll ]
	);

	const form = useMemo( (): Form => {
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

	const onChange = ( edits: Record< string, any > ) => {
		const currentData: Record< string, any > = {
			...record,
			...localEdits,
		};

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
		postId.forEach( ( id, index ) => {
			const edits = { ...localEdits };
			// Leave alone the fields disabled for this post once edited.
			const post = { ...records[ index ], ...localEdits };
			for ( const field of fields ?? [] ) {
				if ( field.id in edits && isFieldDisabled( field, post ) ) {
					delete edits[ field.id ];
				}
			}
			editEntityRecord( 'postType', postType, id, edits );
		} );

		if ( isBulk ) {
			await Promise.allSettled(
				postId.map( ( id ) =>
					saveEditedEntityRecord( 'postType', postType, id )
				)
			);
		} else {
			await saveEditedEntityRecord( 'postType', postType, postId[ 0 ] );
		}
		onSaved?.();
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
				createPortal( <WCPopover.Slot />, modalElement ) }
		</Modal>
	);
}
