import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import type { Form } from '@wordpress/dataviews';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { loadEditorAssets } from '@wordpress/lazy-editor';
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
				// @ts-expect-error inert not typed properly
				inert={ ! isReady ? 'true' : undefined }
			>
				<FieldEdit { ...props } />
			</div>
		);
	};
}

const fieldsWithBulkEditSupport = [ 'status', 'date', 'author', 'discussion' ];

interface QuickEditModalProps {
	postType: string;
	postId: string[];
	closeModal: () => void;
}

export function QuickEditModal( {
	postType,
	postId,
	closeModal,
}: QuickEditModalProps ) {
	const isBulk = postId.length > 1;

	const [ localEdits, setLocalEdits ] = useState< Record< string, any > >(
		{}
	);
	const { record, hasFinishedResolution, canSwitchTemplate } = useSelect(
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
				hasFinishedResolution: ( store as any ).hasFinishedResolution(
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
			_fields?.map( ( field: any ) => {
				if ( field.id === 'status' ) {
					return {
						...field,
						elements: field.elements.filter(
							( element: { value: string } ) =>
								element.value !== 'trash'
						),
					};
				}

				if ( field.id === 'template' ) {
					return {
						...field,
						readOnly: ! canSwitchTemplate,
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
		[ _fields, canSwitchTemplate ]
	);

	const form = useMemo( () => {
		const allFields: Form[ 'fields' ] = [
			{
				id: 'featured_media',
				layout: {
					type: 'regular',
					labelPosition: 'none',
				},
			},
			{
				id: 'status',
				label: __( 'Status' ),
				layout: {
					type: 'panel',
					summary: 'status',
				},
				children: [
					{
						id: 'status',
						layout: { type: 'regular', labelPosition: 'none' },
					},
					'scheduled_date',
					'password',
				],
			},
			'author',
			'date',
			'slug',
			'parent',
			{
				id: 'discussion',
				label: __( 'Discussion' ),
				layout: {
					type: 'panel',
					summary: 'discussion',
				},
				children: [
					{
						id: 'comment_status',
						layout: { type: 'regular', labelPosition: 'none' },
					},
					'ping_status',
				],
			},
			'template',
		];

		return {
			layout: {
				type: 'panel' as const,
			},
			fields: isBulk
				? allFields.filter( ( field ) =>
						fieldsWithBulkEditSupport.includes(
							typeof field === 'string' ? field : field.id
						)
				  )
				: allFields,
		};
	}, [ isBulk ] );

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
