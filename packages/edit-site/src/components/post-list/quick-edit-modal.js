/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm } from '@wordpress/dataviews';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Drawer, VisuallyHidden } from '@wordpress/ui';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [ 'status', 'date', 'author', 'discussion' ];

/**
 * Renders the editable form portion of the Quick Edit drawer.
 *
 * Mounted only while `Drawer.Popup` is on screen — Base UI's portal returns
 * `null` once the drawer's exit animation completes — so the entity-record
 * subscription via `useSelect` and the local edits state are naturally tied
 * to the drawer's open lifecycle: they engage on open, stay alive through
 * the exit animation (so the form keeps rendering while the drawer slides
 * out), and tear down once the drawer is fully closed.
 *
 * @param {Object} props
 * @param {string} props.postType      The post type slug.
 * @param {Array}  props.postId        Array of post ids being edited.
 * @param {Object} props.quickEditForm The form definition for Quick Edit.
 */
function QuickEditSession( { postType, postId, quickEditForm } ) {
	const isBulk = postId.length > 1;

	const [ localEdits, setLocalEdits ] = useState( {} );
	const { record, hasFinishedResolution, canSwitchTemplate } = useSelect(
		( select ) => {
			if ( postId.length === 0 ) {
				return {
					record: null,
					hasFinishedResolution: false,
					canSwitchTemplate: false,
				};
			}

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

	// `Drawer.Action` synchronously closes the drawer through Base UI's
	// `Drawer.Close`, then the save runs in the background. The drawer
	// dismisses immediately for a more responsive feel; entity-record
	// failures surface through core-data's standard error notices.
	const onSave = () => {
		for ( const id of postId ) {
			editEntityRecord( 'postType', postType, id, localEdits );
		}

		if ( isBulk ) {
			postId.forEach( ( id ) =>
				saveEditedEntityRecord( 'postType', postType, id )
			);
		} else {
			saveEditedEntityRecord( 'postType', postType, postId[ 0 ] );
		}
	};

	return (
		<>
			<Drawer.Content>
				<PostCardPanel
					postType={ postType }
					postId={ postId }
					hideActions
				/>
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
				<Drawer.Action onClick={ onSave }>
					{ __( 'Done' ) }
				</Drawer.Action>
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
	const isBulk = postId.length > 1;

	return (
		<Drawer.Root
			open={ open }
			// Physical direction. Quick Edit anchors to the right edge of the
			// viewport in both LTR and RTL — matching the previous Modal-based
			// implementation.
			swipeDirection="right"
			onOpenChange={ ( isOpen ) => {
				if ( ! isOpen ) {
					closeModal();
				}
			} }
		>
			<Drawer.Popup>
				<Drawer.Header>
					{ /*
					 * `PostCardPanel` is the visible "header" content for
					 * Quick Edit (post title, icon, bulk-edit hint), but it
					 * already renders its own `<h2>` heading and is laid out
					 * as a vertical stack — both at odds with `Drawer.Header`,
					 * which expects a single inline title row. As a
					 * short-term measure we render `PostCardPanel` inside
					 * `Drawer.Content` instead and keep the header itself
					 * minimal: a visually-hidden `Drawer.Title` (rendered as
					 * a `<span>` so we don't introduce a second `<h2>` that
					 * would compete with PostCardPanel's heading) plus the
					 * close icon. Base UI still wires `aria-labelledby`
					 * automatically. Tracked follow-up: integrate
					 * `PostCardPanel` properly with `Drawer.Header`.
					 */ }
					<VisuallyHidden
						render={
							<Drawer.Title render={ <span /> }>
								{ isBulk
									? __( 'Bulk quick edit' )
									: __( 'Quick edit' ) }
							</Drawer.Title>
						}
					/>
					<Drawer.CloseIcon />
				</Drawer.Header>
				<QuickEditSession
					postType={ postType }
					postId={ postId }
					quickEditForm={ quickEditForm }
				/>
			</Drawer.Popup>
		</Drawer.Root>
	);
}
