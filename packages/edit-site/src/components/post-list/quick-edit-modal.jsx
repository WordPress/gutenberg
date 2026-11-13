import { __, isRTL } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption alongside Drawer.
	Button,
	// eslint-disable-next-line @wordpress/use-recommended-components -- Replace the custom Modal drawer with the Drawer primitive.
	Drawer,
	VisuallyHidden,
} from '@wordpress/ui';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '../../lock-unlock';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [ 'status', 'date', 'author', 'discussion' ];

function QuickEditSession( { postType, postId, closeModal, quickEditForm } ) {
	const isBulk = postId.length > 1;

	const [ localEdits, setLocalEdits ] = useState( {} );
	const { record, hasFinishedResolution, canSwitchTemplate } = useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				hasFinishedResolution: hasFinished,
			} = select( coreDataStore );

			if ( isBulk || postId.length === 0 ) {
				return {
					record: null,
					hasFinishedResolution: postId.length > 0,
					canSwitchTemplate: false,
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
		<>
			<Drawer.Header>
				<VisuallyHidden render={ <Drawer.Title /> }>
					{ isBulk ? __( 'Bulk edit' ) : __( 'Quick edit' ) }
				</VisuallyHidden>
				<PostCardPanel
					postType={ postType }
					postId={ postId }
					hideActions
				/>
			</Drawer.Header>
			<Drawer.Content>
				{ hasFinishedResolution && (
					<DataForm
						data={ { ...record, ...localEdits } }
						fields={ fields }
						form={ form }
						onChange={ onChange }
					/>
				) }
			</Drawer.Content>
			<Drawer.Footer>
				<Drawer.Action variant="outline">
					{ __( 'Cancel' ) }
				</Drawer.Action>
				<Button onClick={ onSave }>{ __( 'Done' ) }</Button>
			</Drawer.Footer>
		</>
	);
}

export function QuickEditModal( {
	open,
	postType,
	postId,
	closeModal,
	quickEditForm,
} ) {
	return (
		<Drawer.Root
			open={ open }
			swipeDirection={ isRTL() ? 'left' : 'right' }
			onOpenChange={ ( isOpen ) => {
				if ( ! isOpen ) {
					closeModal();
				}
			} }
		>
			<Drawer.Popup>
				{ /* Keep edits alive through the exit animation and reset them for a different selection. */ }
				<QuickEditSession
					key={ `${ postType }:${ postId.join( ',' ) }` }
					postType={ postType }
					postId={ postId }
					closeModal={ closeModal }
					quickEditForm={ quickEditForm }
				/>
			</Drawer.Popup>
		</Drawer.Root>
	);
}
