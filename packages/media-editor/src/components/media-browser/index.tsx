/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	createPortal,
	useState,
	useCallback,
	useMemo,
	useRef,
	useEffect,
	useContext,
} from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	privateApis as coreDataPrivateApis,
	store as coreStore,
} from '@wordpress/core-data';
import { resolveSelect, useDispatch, useSelect } from '@wordpress/data';
import {
	Button,
	DropZone,
	FormFileUpload,
	Modal,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	arrowRight,
	drawerRight,
	upload as uploadIcon,
} from '@wordpress/icons';
import { DataViewsPicker } from '@wordpress/dataviews';
import type {
	ActionButton,
	Field,
	SupportedLayouts,
	View,
} from '@wordpress/dataviews';
import { useView } from '@wordpress/views';
import { Stack } from '@wordpress/ui';
import {
	altTextField,
	attachedToField,
	authorField,
	captionField,
	dateAddedField,
	dateModifiedField,
	descriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mediaThumbnailField,
	mimeTypeField,
} from '@wordpress/media-fields';
import { store as noticesStore, SnackbarNotices } from '@wordpress/notices';
import {
	ComplementaryArea,
	InterfaceSkeleton,
	PinnedItems,
	// No type declarations available for @wordpress/interface.
	// @ts-expect-error
} from '@wordpress/interface';
import {
	transformAttachment,
	uploadMedia,
	type Attachment,
	type RestAttachment,
} from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as mediaEditorStore } from '../../store';
import type { BrowseState } from '../../store/reducer';
import { MediaEditorProvider, type Media } from '../media-editor-provider';
import MediaForm from '../media-form';
import { UploadStatusPopover } from './upload-status-popover';
import { useInvalidateAttachmentResolutions } from './use-invalidate-attachment-resolutions';
import { useUploadStatus } from './use-upload-status';

const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { Tabs } = unlock( componentsPrivateApis );

// Layout constants - matching the picker layout types
const LAYOUT_PICKER_GRID = 'pickerGrid';
const LAYOUT_PICKER_TABLE = 'pickerTable';

// Custom notices context for the media modal browse mode
const NOTICES_CONTEXT = 'media-modal';
const NOTICE_ID_UPLOAD_PROGRESS = 'media-modal-upload-progress';

type ViewQueryParams = Pick< View, 'page' | 'search' >;

const defaultQueryParams: ViewQueryParams = {
	page: 1,
	search: '',
};

const defaultView: View = {
	type: LAYOUT_PICKER_GRID,
	fields: [],
	showTitle: false,
	titleField: 'title',
	mediaField: 'media_thumbnail',
	perPage: 50,
	filters: [],
	layout: {
		previewSize: 170,
		density: 'compact',
	},
};

const defaultLayouts: SupportedLayouts = {
	[ LAYOUT_PICKER_GRID ]: {
		fields: [],
		showTitle: false,
		layout: {
			previewSize: 170,
			density: 'compact',
		},
	},
	[ LAYOUT_PICKER_TABLE ]: {
		fields: [
			'filename',
			'filesize',
			'media_dimensions',
			'author',
			'date',
		],
		showTitle: true,
	},
};

type SidebarEmptyState = 'none' | 'no-selection' | 'multi-selection';

interface BrowserSidebarProps {
	canEdit: boolean;
	emptyState: SidebarEmptyState;
	onEdit: () => void;
}

function BrowserSidebar( {
	canEdit,
	emptyState,
	onEdit,
}: BrowserSidebarProps ) {
	const tabsContextValue = useContext( Tabs.Context );

	const emptyStateLabel =
		emptyState === 'multi-selection'
			? __(
					'Multiple items selected. Select one item to view its details.'
			  )
			: __( 'Select an item to view its details.' );

	return (
		<ComplementaryArea
			scope="media-browser"
			identifier="media-browser/details"
			title={ __( 'Details' ) }
			icon={ drawerRight }
			isActiveByDefault
			className="media-editor__sidebar media-modal-browser__sidebar"
			panelClassName="media-editor__sidebar-panel"
			headerClassName="media-editor__sidebar-header"
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<Tabs.TabList>
						<Tabs.Tab tabId="details">{ __( 'Details' ) }</Tabs.Tab>
					</Tabs.TabList>
				</Tabs.Context.Provider>
			}
		>
			<Tabs.Context.Provider value={ tabsContextValue }>
				<Tabs.TabPanel tabId="details" focusable={ false }>
					{ emptyState !== 'none' ? (
						<div className="media-modal-browser__sidebar-empty">
							{ emptyStateLabel }
						</div>
					) : (
						<Stack
							className="media-editor__panel"
							direction="column"
							gap="lg"
						>
							<MediaForm />
							{ canEdit && (
								<Button
									className="media-modal-browser__edit-image"
									variant="secondary"
									icon={ arrowRight }
									iconPosition="right"
									onClick={ onEdit }
									__next40pxDefaultSize
								>
									{ __( 'Edit image' ) }
								</Button>
							) }
						</Stack>
					) }
				</Tabs.TabPanel>
			</Tabs.Context.Provider>
		</ComplementaryArea>
	);
}

interface MediaBrowserProps {
	/**
	 * Attachment fields to render in the Details sidebar tab.
	 * Passed from the editor layer (which owns `usePostFields`), since
	 * `@wordpress/media-editor` cannot depend on `@wordpress/editor`.
	 */
	fields?: Field< Media >[];
}

/**
 * Singleton browse view of the unified media modal. Reads its configuration
 * (allowed types, multiple, callbacks, etc.) from the `core/media-editor`
 * store rather than from props — there is only ever one instance, mounted
 * by the editor at the root.
 * @param root0
 * @param root0.fields
 */
export function MediaBrowser( {
	fields: detailsFields = [],
}: MediaBrowserProps ) {
	const browse = useSelect(
		( select ) => select( mediaEditorStore ).getBrowseState(),
		[]
	);

	if ( ! browse ) {
		return null;
	}

	return (
		<MediaBrowserContent
			browse={ browse }
			detailsFields={ detailsFields }
		/>
	);
}

function MediaBrowserContent( {
	browse,
	detailsFields,
}: {
	browse: BrowseState;
	detailsFields: Field< Media >[];
} ) {
	const {
		config: {
			allowedTypes,
			multiple = false,
			value: initialValue,
			title = __( 'Select Media' ),
			isDismissible = true,
			modalClass,
			search = true,
			searchLabel = __( 'Search media' ),
		},
		callbacks: { onSelect, onClose, onUpload },
		session,
	} = browse;

	const { closeMediaUploadModal, selectMediaInBrowser, enterEditMode } =
		useDispatch( mediaEditorStore );

	const [ selection, setSelection ] = useState< string[] >( () => {
		if ( ! initialValue ) {
			return [];
		}
		return Array.isArray( initialValue )
			? initialValue.map( String )
			: [ String( initialValue ) ];
	} );

	// Mirror single-item selection into the store so any other readers
	// (the Details sidebar logic in this component reads it locally, but
	// other listeners — e.g. a future global selection indicator — can
	// react too).
	useEffect( () => {
		if ( multiple ) {
			selectMediaInBrowser(
				selection.length ? selection.map( Number ) : null
			);
		} else {
			selectMediaInBrowser(
				selection.length === 1 ? Number( selection[ 0 ] ) : null
			);
		}
	}, [ multiple, selection, selectMediaInBrowser ] );

	const { createSuccessNotice, removeAllNotices } =
		useDispatch( noticesStore );
	const invalidateAttachmentResolutions =
		useInvalidateAttachmentResolutions();
	const [ queryParams, setQueryParams ] = useState< ViewQueryParams >(
		() => defaultQueryParams
	);

	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: 'attachment',
		slug: 'media-modal',
		defaultView,
		queryParams,
		onChangeQueryParams: setQueryParams,
	} );

	const handleChangeView = useCallback(
		( nextView: View ) => {
			const normalizedView = { ...nextView };
			if ( normalizedView.startPosition === undefined ) {
				delete normalizedView.startPosition;
			}
			updateView( normalizedView );
		},
		[ updateView ]
	);

	const queryArgs = useMemo( () => {
		const filters: Record< string, any > = {};

		view.filters?.forEach( ( filter ) => {
			if ( filter.field === 'media_type' ) {
				filters.media_type = filter.value;
			}
			if ( filter.field === 'author' ) {
				if ( filter.operator === 'isAny' ) {
					filters.author = filter.value;
				} else if ( filter.operator === 'isNone' ) {
					filters.author_exclude = filter.value;
				}
			}
			if ( filter.field === 'date' || filter.field === 'modified' ) {
				if ( filter.operator === 'before' ) {
					filters.before = filter.value;
				} else if ( filter.operator === 'after' ) {
					filters.after = filter.value;
				}
			}
			if ( filter.field === 'mime_type' ) {
				filters.mime_type = filter.value;
			}
		} );

		if (
			! filters.media_type &&
			! filters.mime_type &&
			allowedTypes &&
			! allowedTypes.includes( '*' )
		) {
			const { mediaTypes, mimeTypes } = allowedTypes.reduce(
				(
					acc: { mediaTypes: string[]; mimeTypes: string[] },
					type: string
				) => {
					if ( type.endsWith( '/*' ) ) {
						acc.mediaTypes.push( type.replace( '/*', '' ) );
					} else if ( type.includes( '/' ) ) {
						acc.mimeTypes.push( type );
					} else {
						acc.mediaTypes.push( type );
					}
					return acc;
				},
				{ mediaTypes: [], mimeTypes: [] }
			);

			if ( mediaTypes.length ) {
				filters.media_type = mediaTypes;
			}
			if ( mimeTypes.length ) {
				filters.mime_type = mimeTypes;
			}
		}

		return {
			per_page: view.perPage || 20,
			page: view.page || 1,
			status: 'inherit',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			_embed: 'author,wp:attached-to',
			...filters,
		};
	}, [ view, allowedTypes ] );

	const handleBatchComplete = useCallback(
		( attachments: Partial< Attachment >[] ) => {
			const uploadedIds = attachments
				.map( ( attachment ) => String( attachment.id ) )
				.filter( Boolean );

			if ( multiple ) {
				setSelection( ( prev ) => {
					const existing = new Set( prev );
					const newIds = uploadedIds.filter(
						( id ) => ! existing.has( id )
					);
					return [ ...prev, ...newIds ];
				} );
			} else {
				setSelection( uploadedIds.slice( 0, 1 ) );
			}

			invalidateAttachmentResolutions();
		},
		[ multiple, invalidateAttachmentResolutions ]
	);

	const {
		uploadingFiles,
		registerBatch,
		dismissError,
		clearCompleted,
		allComplete,
	} = useUploadStatus( { onBatchComplete: handleBatchComplete } );

	const isPopoverOpenRef = useRef( false );
	const handlePopoverOpenChange = useCallback(
		( open: boolean ) => {
			isPopoverOpenRef.current = open;
			if ( ! open ) {
				clearCompleted();
			}
		},
		[ clearCompleted ]
	);

	const {
		records: mediaRecords,
		isResolving: isLoading,
		totalItems,
		totalPages,
	} = useEntityRecordsWithPermissions( 'postType', 'attachment', queryArgs );

	const fields: Field< RestAttachment >[] = useMemo(
		() => [
			{
				...( mediaThumbnailField as Field< RestAttachment > ),
				enableHiding: false,
			},
			{
				id: 'title',
				type: 'text' as const,
				label: __( 'Title' ),
				getValue: ( { item }: { item: RestAttachment } ) => {
					const titleValue = item.title.raw || item.title.rendered;
					return titleValue || __( '(no title)' );
				},
			},
			altTextField as Field< RestAttachment >,
			captionField as Field< RestAttachment >,
			descriptionField as Field< RestAttachment >,
			dateAddedField as Field< RestAttachment >,
			dateModifiedField as Field< RestAttachment >,
			authorField as Field< RestAttachment >,
			filenameField as Field< RestAttachment >,
			filesizeField as Field< RestAttachment >,
			mediaDimensionsField as Field< RestAttachment >,
			mimeTypeField as Field< RestAttachment >,
			attachedToField as Field< RestAttachment >,
		],
		[]
	);

	const actions: ActionButton< RestAttachment >[] = useMemo(
		() => [
			{
				id: 'select',
				label: __( 'Select' ),
				isPrimary: true,
				supportsBulk: multiple,
				async callback() {
					if ( selection.length === 0 ) {
						return;
					}

					const selectedPostsQuery = {
						include: selection,
						per_page: -1,
					};

					const selectedPosts = await resolveSelect(
						coreStore
					).getEntityRecords< RestAttachment >(
						'postType',
						'attachment',
						selectedPostsQuery
					);

					const transformedPosts = ( selectedPosts ?? [] )
						.map( transformAttachment )
						.filter( Boolean );

					const selectedItems = multiple
						? transformedPosts
						: transformedPosts?.[ 0 ];

					removeAllNotices( 'snackbar', NOTICES_CONTEXT );
					onSelect( selectedItems );
					// Match the pre-shim behavior where MediaUploadModalWrapper
					// invoked onClose after onSelect — preserved by always
					// dispatching close-by-session after select.
					closeMediaUploadModal( { session } );
				},
			},
		],
		[
			multiple,
			onSelect,
			selection,
			removeAllNotices,
			closeMediaUploadModal,
			session,
		]
	);

	const handleModalClose = useCallback( () => {
		removeAllNotices( 'snackbar', NOTICES_CONTEXT );
		onClose?.();
		closeMediaUploadModal( { session } );
	}, [ removeAllNotices, onClose, closeMediaUploadModal, session ] );

	const handleUpload = onUpload || uploadMedia;

	const prevAllCompleteRef = useRef( false );
	useEffect( () => {
		if ( allComplete && ! prevAllCompleteRef.current ) {
			const completeCount = uploadingFiles.filter(
				( file ) => file.status === 'uploaded'
			).length;
			if ( completeCount > 0 ) {
				createSuccessNotice(
					sprintf(
						// translators: %s: number of files
						_n(
							'Uploaded %s file',
							'Uploaded %s files',
							completeCount
						),
						completeCount.toLocaleString()
					),
					{
						type: 'snackbar',
						context: NOTICES_CONTEXT,
						id: NOTICE_ID_UPLOAD_PROGRESS,
					}
				);
			}

			if ( ! isPopoverOpenRef.current ) {
				clearCompleted();
			}
		}
		prevAllCompleteRef.current = allComplete;
	}, [ allComplete, uploadingFiles, createSuccessNotice, clearCompleted ] );

	const handleFileSelect = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			const files = event.target.files;
			if ( files && files.length > 0 ) {
				const filesArray = Array.from( files );
				const { onFileChange, onError } = registerBatch( filesArray );

				handleUpload( {
					allowedTypes,
					filesList: filesArray,
					onFileChange,
					onError,
				} );
			}
		},
		[ allowedTypes, handleUpload, registerBatch ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems,
			totalPages,
		} ),
		[ totalItems, totalPages ]
	);

	const acceptTypes = useMemo( () => {
		if ( allowedTypes?.includes( '*' ) ) {
			return undefined;
		}
		return allowedTypes?.join( ',' );
	}, [ allowedTypes ] );

	// --- Details-sidebar data wiring (single image selection only) ---
	const singleSelectedId =
		! multiple && selection.length === 1 ? Number( selection[ 0 ] ) : null;

	const { media, isImage } = useSelect(
		( select ) => {
			if ( ! singleSelectedId ) {
				return { media: undefined, isImage: false };
			}
			const { getEditedEntityRecord, getEntityRecord } =
				select( coreStore );
			// Trigger an _embed fetch so the Details fields have author/parent.
			getEntityRecord( 'postType', 'attachment', singleSelectedId, {
				_embed: 'author,wp:attached-to',
			} );
			const record = getEditedEntityRecord(
				'postType',
				'attachment',
				singleSelectedId
			) as ( Media & Partial< RestAttachment > ) | undefined;
			return {
				media: record as Media | undefined,
				isImage:
					typeof record?.mime_type === 'string' &&
					record.mime_type.startsWith( 'image/' ),
			};
		},
		[ singleSelectedId ]
	);

	const { editEntityRecord } = useDispatch( coreStore );

	const handleSidebarChange = useCallback(
		( updates: Partial< Media > ) => {
			if ( ! singleSelectedId ) {
				return;
			}
			editEntityRecord(
				'postType',
				'attachment',
				singleSelectedId,
				updates
			);
		},
		[ singleSelectedId, editEntityRecord ]
	);

	const handleEditImage = useCallback( () => {
		if ( ! singleSelectedId ) {
			return;
		}
		enterEditMode( { id: singleSelectedId } );
	}, [ singleSelectedId, enterEditMode ] );

	let sidebarEmptyState: SidebarEmptyState = 'none';
	if ( multiple && selection.length > 1 ) {
		sidebarEmptyState = 'multi-selection';
	} else if ( ! singleSelectedId ) {
		sidebarEmptyState = 'no-selection';
	}

	return (
		<Modal
			title={ title }
			onRequestClose={ handleModalClose }
			isDismissible={ isDismissible }
			className={ clsx( 'media-modal-browser', modalClass ) }
			overlayClassName="media-modal-browser__overlay"
			size="fill"
			headerActions={
				<Stack
					direction="row"
					align="center"
					gap="xs"
					className="media-modal-browser__header-actions"
				>
					<FormFileUpload
						accept={ acceptTypes }
						multiple
						onChange={ handleFileSelect }
						__next40pxDefaultSize
						render={ ( { openFileDialog } ) => (
							<Button
								onClick={ openFileDialog }
								icon={ uploadIcon }
								__next40pxDefaultSize
							>
								{ __( 'Upload media' ) }
							</Button>
						) }
					/>
					<PinnedItems.Slot scope="media-browser" />
				</Stack>
			}
		>
			<MediaEditorProvider
				value={ media ?? undefined }
				onChange={ handleSidebarChange }
				settings={ { fields: detailsFields } }
			>
				<Tabs>
					<BrowserSidebar
						canEdit={ sidebarEmptyState === 'none' && isImage }
						emptyState={ sidebarEmptyState }
						onEdit={ handleEditImage }
					/>
				</Tabs>
				<InterfaceSkeleton
					className="media-modal-browser__skeleton"
					labels={ {
						body: __( 'Media library' ),
						sidebar: __( 'Media details' ),
					} }
					content={
						<>
							<DropZone
								onFilesDrop={ ( files ) => {
									let filteredFiles = files;
									if (
										allowedTypes &&
										! allowedTypes.includes( '*' )
									) {
										filteredFiles = files.filter(
											( file ) =>
												allowedTypes.some(
													( allowedType: string ) =>
														file.type ===
															allowedType ||
														file.type.startsWith(
															allowedType.replace(
																'*',
																''
															)
														)
												)
										);
									}
									if ( filteredFiles.length > 0 ) {
										const { onFileChange, onError } =
											registerBatch( filteredFiles );

										handleUpload( {
											allowedTypes,
											filesList: filteredFiles,
											onFileChange,
											onError,
										} );
									}
								} }
								label={ __( 'Drop files to upload' ) }
							/>
							<DataViewsPicker
								data={ mediaRecords || [] }
								fields={ fields }
								view={ view }
								onChangeView={ handleChangeView }
								actions={ actions }
								selection={ selection }
								onChangeSelection={ setSelection }
								isLoading={ isLoading }
								paginationInfo={ paginationInfo }
								defaultLayouts={ defaultLayouts }
								getItemId={ ( item: RestAttachment ) =>
									String( item.id )
								}
								itemListLabel={ __( 'Media items' ) }
								onReset={ isModified ? resetToDefault : false }
							>
								<Stack
									direction="row"
									align="top"
									justify="space-between"
									className="dataviews__view-actions"
									gap="xs"
								>
									<Stack
										direction="row"
										gap="sm"
										justify="start"
										className="dataviews__search"
									>
										{ search && (
											<DataViewsPicker.Search
												label={ searchLabel }
											/>
										) }
										<DataViewsPicker.FiltersToggle />
									</Stack>
									<Stack
										direction="row"
										gap="xs"
										style={ { flexShrink: 0 } }
									>
										<DataViewsPicker.LayoutSwitcher />
										<DataViewsPicker.ViewConfig />
									</Stack>
								</Stack>
								<DataViewsPicker.FiltersToggled className="dataviews-filters__container" />
								<DataViewsPicker.Layout />
								<div
									className={ clsx(
										'media-modal-browser__footer',
										{
											'is-uploading':
												uploadingFiles.length > 0,
										}
									) }
								>
									<UploadStatusPopover
										uploadingFiles={ uploadingFiles }
										onDismissError={ dismissError }
										onOpenChange={ handlePopoverOpenChange }
									/>
									<DataViewsPicker.BulkActionToolbar />
								</div>
							</DataViewsPicker>
						</>
					}
					sidebar={ <ComplementaryArea.Slot scope="media-browser" /> }
				/>
			</MediaEditorProvider>
			{ createPortal(
				<SnackbarNotices
					className="media-modal-browser__snackbar"
					context={ NOTICES_CONTEXT }
				/>,
				document.body
			) }
		</Modal>
	);
}

export default MediaBrowser;
