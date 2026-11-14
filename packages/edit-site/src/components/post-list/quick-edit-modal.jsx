import { __, isRTL } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { DataForm, useUiOverlaySupport } from '@wordpress/dataviews';
import {
	Modal,
	SlotFillProvider,
	Popover as WCPopover,
	Button as LegacyButton,
} from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption alongside Drawer.
	Button,
	// eslint-disable-next-line @wordpress/use-recommended-components -- Replace the custom Modal drawer with the Drawer primitive.
	Drawer,
	VisuallyHidden,
	Stack,
} from '@wordpress/ui';
import {
	createPortal,
	useCallback,
	useEffect,
	useMemo,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '../../lock-unlock';

const { usePostFields, PostCardPanel } = unlock( editorPrivateApis );

const fieldsWithBulkEditSupport = [ 'status', 'date', 'author', 'discussion' ];

function QuickEditSession( {
	open,
	postType,
	postId,
	closeModal,
	quickEditForm,
	onClosed,
} ) {
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

	const legacySlotName = useId();
	const supported = useUiOverlaySupport( fields ?? [] );
	const [ nativeHost, setNativeHost ] = useState( supported );
	if ( nativeHost && ! supported ) {
		setNativeHost( false );
	}
	const useUiHost = nativeHost && supported;
	const [ modalElement, setModalElement ] = useState( null );
	const finalFocusRef = useRef( null );
	const setSource = useCallback( ( node ) => {
		if ( node && ! finalFocusRef.current ) {
			const active = node.ownerDocument.activeElement;
			if (
				active instanceof node.ownerDocument.defaultView.HTMLElement
			) {
				finalFocusRef.current = active;
			}
		}
	}, [] );
	const finishClose = useCallback( () => {
		onClosed();
		if ( finalFocusRef.current?.isConnected ) {
			finalFocusRef.current.focus();
		}
	}, [ onClosed ] );
	useEffect( () => {
		if ( ! open && ! useUiHost ) {
			finishClose();
		}
	}, [ open, useUiHost, finishClose ] );

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

	const title = isBulk ? __( 'Bulk edit' ) : __( 'Quick edit' );
	const card = (
		<PostCardPanel postType={ postType } postId={ postId } hideActions />
	);
	const content = hasFinishedResolution && (
		<DataForm
			data={ { ...record, ...localEdits } }
			fields={ fields }
			form={ form }
			onChange={ onChange }
		/>
	);
	return (
		<>
			<span hidden ref={ setSource } />
			{ useUiHost ? (
				<Drawer.Root
					open={ open }
					swipeDirection={ isRTL() ? 'left' : 'right' }
					onOpenChange={ ( isOpen ) => {
						if ( ! isOpen ) {
							closeModal();
						}
					} }
					onOpenChangeComplete={ ( isOpen ) => {
						if ( ! isOpen && ! open ) {
							finishClose();
						}
					} }
				>
					<Drawer.Popup
						finalFocus={ finalFocusRef }
						style={ { overflow: 'visible' } }
					>
						<SlotFillProvider passthrough>
							<WCPopover.__unstableSlotNameProvider
								value={ legacySlotName }
							>
								<Drawer.Header>
									<VisuallyHidden render={ <Drawer.Title /> }>
										{ title }
									</VisuallyHidden>
									{ card }
								</Drawer.Header>
								<Drawer.Content>{ content }</Drawer.Content>
								<Drawer.Footer>
									<Drawer.Action variant="outline">
										{ __( 'Cancel' ) }
									</Drawer.Action>
									<Button onClick={ onSave }>
										{ __( 'Done' ) }
									</Button>
								</Drawer.Footer>
							</WCPopover.__unstableSlotNameProvider>
							<WCPopover.Slot name={ legacySlotName } />
						</SlotFillProvider>
					</Drawer.Popup>
				</Drawer.Root>
			) : (
				open && (
					<Modal
						ref={ setModalElement }
						size="small"
						title={ title }
						overlayClassName="dataviews-action-modal__quick-edit"
						__experimentalHideHeader
						onRequestClose={ closeModal }
						focusOnMount="firstElement"
					>
						<div className="dataviews-action-modal__quick-edit-header">
							{ card }
						</div>
						<div className="dataviews-action-modal__quick-edit-content">
							{ content }
						</div>
						<Stack
							direction="row"
							gap="md"
							className="dataviews-action-modal__quick-edit-footer"
						>
							<LegacyButton
								__next40pxDefaultSize
								variant="secondary"
								onClick={ closeModal }
							>
								{ __( 'Cancel' ) }
							</LegacyButton>
							<LegacyButton
								__next40pxDefaultSize
								variant="primary"
								onClick={ onSave }
							>
								{ __( 'Done' ) }
							</LegacyButton>
						</Stack>
						{ modalElement &&
							createPortal( <WCPopover.Slot />, modalElement ) }
					</Modal>
				)
			) }
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
	const [ session, setSession ] = useState( {
		open,
		mounted: open,
		generation: 0,
	} );
	if ( open !== session.open ) {
		setSession( {
			open,
			mounted: open || session.mounted,
			generation: session.generation + Number( open ),
		} );
	}
	const onClosed = useCallback(
		() =>
			setSession( ( previous ) =>
				previous.open ? previous : { ...previous, mounted: false }
			),
		[]
	);
	return session.mounted ? (
		<QuickEditSession
			key={ `${ postType }:${ postId.join( ',' ) }:${ session.generation }` }
			open={ open }
			postType={ postType }
			postId={ postId }
			closeModal={ closeModal }
			quickEditForm={ quickEditForm }
			onClosed={ onClosed }
		/>
	) : null;
}
