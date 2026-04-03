/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	DropZone,
	Icon,
	Spinner,
	__experimentalText as Text,
	__experimentalTruncate as Truncate,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	BaseControl,
	Tooltip,
	VisuallyHidden,
} from '@wordpress/components';
import { isBlobURL, getBlobTypeByURL } from '@wordpress/blob';
import { store as coreStore, type Attachment } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	archive,
	audio,
	video,
	file,
	closeSmall,
	error as errorIcon,
	chevronUp,
	chevronDown,
	chevronLeft,
	chevronRight,
} from '@wordpress/icons';
import {
	MediaUpload,
	uploadMedia,
	privateApis as mediaUtilsPrivateApis,
} from '@wordpress/media-utils';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import type { MediaEditProps } from '../../types';
import useMovingAnimation from './use-moving-animation';

const { MediaUploadModal } = unlock( mediaUtilsPrivateApis );

function AnimatedMediaItem( {
	children,
	index,
	className,
}: {
	children: React.ReactNode;
	index: number;
	className?: string;
} ) {
	const ref = useMovingAnimation( index );
	return (
		<div ref={ ref } className={ className }>
			{ children }
		</div>
	);
}

type BlobItem = {
	id: string;
	source_url: string;
	mime_type: string | undefined;
	alt_text?: string;
};

function normalizeValue( value: number | number[] | undefined ): number[] {
	if ( Array.isArray( value ) ) {
		return value;
	}
	return value ? [ value ] : [];
}

/**
 * Conditional Media component that uses MediaUploadModal when experiment is enabled,
 * otherwise falls back to media-utils MediaUpload.
 *
 * @param root0          Component props.
 * @param root0.render   Render prop function that receives { open } object.
 * @param root0.multiple Whether to allow multiple media selections.
 * @return The component.
 */
function ConditionalMediaUpload( { render, multiple, ...props }: any ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	if ( ( window as any ).__experimentalDataViewsMediaModal ) {
		return (
			<>
				{ render && render( { open: () => setIsModalOpen( true ) } ) }
				{ isModalOpen && (
					<MediaUploadModal
						{ ...props }
						multiple={ multiple }
						isOpen={ isModalOpen }
						onClose={ () => {
							setIsModalOpen( false );
							props.onClose?.();
						} }
						onSelect={ ( media: any ) => {
							setIsModalOpen( false );
							props.onSelect?.( media );
						} }
					/>
				) }
			</>
		);
	}
	// Fallback to media-utils MediaUpload when experiment is disabled.
	return (
		<MediaUpload
			{ ...props }
			render={ render }
			multiple={ multiple ? 'add' : undefined }
		/>
	);
}

function MediaPickerButton( {
	open,
	children,
	label,
	showTooltip = false,
	onFilesDrop,
	attachment,
	isUploading = false,
}: {
	open: () => void;
	children: React.ReactNode;
	label: string;
	showTooltip?: boolean;
	onFilesDrop: MediaEditAttachmentsProps[ 'onFilesDrop' ];
	attachment?: MediaEditAttachment;
	isUploading?: boolean;
} ) {
	const isBlob = attachment && isBlobURL( attachment.source_url );
	const mediaPickerButton = (
		<div
			className={ clsx( 'fields__media-edit-picker-button', {
				'has-attachment': attachment,
			} ) }
			role="button"
			tabIndex={ 0 }
			onClick={ () => {
				if ( ! isUploading ) {
					open();
				}
			} }
			onKeyDown={ ( event ) => {
				if ( isUploading ) {
					return;
				}
				if ( event.key === 'Enter' || event.key === ' ' ) {
					event.preventDefault();
					open();
				}
			} }
			aria-label={ label }
			aria-disabled={ isUploading }
		>
			{ children }
			{ isBlob && (
				<span className="fields__media-edit-picker-button-spinner">
					<Spinner />
				</span>
			) }
			{ ! isUploading && (
				<DropZone
					onFilesDrop={ ( files ) =>
						onFilesDrop( files, attachment?.id as number )
					}
				/>
			) }
		</div>
	);
	if ( ! showTooltip ) {
		return mediaPickerButton;
	}
	return (
		<Tooltip text={ label } placement="top">
			{ mediaPickerButton }
		</Tooltip>
	);
}

const archiveMimeTypes = [
	'application/zip',
	'application/x-zip-compressed',
	'application/x-rar-compressed',
	'application/x-7z-compressed',
	'application/x-tar',
	'application/x-gzip',
];

function MediaTitle( { attachment }: { attachment: Attachment< 'view' > } ) {
	return (
		<Truncate className="fields__media-edit-filename">
			{ attachment.title.rendered }
		</Truncate>
	);
}

function MediaEditPlaceholder( props: {
	open: () => void;
	label: string;
	onFilesDrop: MediaEditAttachmentsProps[ 'onFilesDrop' ];
	isUploading: boolean;
} ) {
	return (
		<MediaPickerButton { ...props }>
			<span className="fields__media-edit-placeholder">
				{ props.label }
			</span>
		</MediaPickerButton>
	);
}

function MoveButtons( {
	itemId,
	index,
	totalItems,
	isUploading,
	moveItem,
	orientation = 'vertical',
}: {
	itemId: number;
	index: number;
	totalItems: number;
	isUploading: boolean;
	moveItem: ( id: number, direction: 'up' | 'down' ) => void;
	orientation?: 'vertical' | 'horizontal';
} ) {
	const isHorizontal = orientation === 'horizontal';
	return (
		<>
			<Button
				__next40pxDefaultSize
				icon={ isHorizontal ? chevronLeft : chevronUp }
				label={ isHorizontal ? __( 'Move left' ) : __( 'Move up' ) }
				size="small"
				disabled={ isUploading || index === 0 }
				accessibleWhenDisabled
				tooltipPosition="top"
				onClick={ ( event: React.MouseEvent< HTMLButtonElement > ) => {
					event.stopPropagation();
					moveItem( itemId, 'up' );
				} }
			/>
			<Button
				__next40pxDefaultSize
				icon={ isHorizontal ? chevronRight : chevronDown }
				label={ isHorizontal ? __( 'Move right' ) : __( 'Move down' ) }
				size="small"
				disabled={ isUploading || index === totalItems - 1 }
				accessibleWhenDisabled
				tooltipPosition="top"
				onClick={ ( event: React.MouseEvent< HTMLButtonElement > ) => {
					event.stopPropagation();
					moveItem( itemId, 'down' );
				} }
			/>
		</>
	);
}

function MediaPreview( { attachment }: { attachment: MediaEditAttachment } ) {
	const url = attachment.source_url;
	const mimeType = attachment.mime_type || '';
	if ( mimeType.startsWith( 'image' ) ) {
		return (
			<img
				className="fields__media-edit-thumbnail"
				alt={ attachment.alt_text || '' }
				src={ url }
			/>
		);
	} else if ( mimeType.startsWith( 'audio' ) ) {
		return <Icon icon={ audio } />;
	} else if ( mimeType.startsWith( 'video' ) ) {
		return <Icon icon={ video } />;
	} else if ( archiveMimeTypes.includes( mimeType ) ) {
		return <Icon icon={ archive } />;
	}
	return <Icon icon={ file } />;
}

type MediaEditAttachment = Attachment< 'view' > | BlobItem;
interface MediaEditAttachmentsProps {
	allItems: Array< MediaEditAttachment > | null;
	addButtonLabel: string;
	multiple?: boolean;
	removeItem: ( itemId: number ) => void;
	moveItem: ( itemId: number, direction: 'up' | 'down' ) => void;
	open: () => void;
	onFilesDrop: ( files: File[], attachmentId?: number ) => void;
	isUploading: boolean;
	setTargetItemId: ( id?: number ) => void;
}

function ExpandedMediaEditAttachments( {
	allItems,
	addButtonLabel,
	multiple,
	removeItem,
	moveItem,
	open,
	onFilesDrop,
	isUploading,
	setTargetItemId,
}: MediaEditAttachmentsProps ) {
	return (
		<div
			className={ clsx( 'fields__media-edit-expanded', {
				'is-multiple': multiple,
				'is-single': ! multiple,
				'is-empty': ! allItems?.length,
			} ) }
		>
			{ allItems?.map( ( attachment, index ) => {
				const hasPreviewImage =
					attachment.mime_type?.startsWith( 'image' );
				const isBlob = isBlobURL( attachment.source_url );
				const attachmentNumericId = attachment.id as number;
				return (
					<AnimatedMediaItem
						key={ attachment.id }
						index={ index }
						className={ clsx( 'fields__media-edit-expanded-item', {
							'has-preview-image': hasPreviewImage,
						} ) }
					>
						<MediaPickerButton
							open={ () => {
								setTargetItemId( attachmentNumericId );
								open();
							} }
							label={
								! isBlob
									? sprintf(
											/* translators: %s: The title of the media item. */
											__( 'Replace %s' ),
											(
												attachment as Attachment< 'view' >
											 ).title.rendered
									  )
									: __( 'Replace' )
							}
							showTooltip
							onFilesDrop={ onFilesDrop }
							attachment={ attachment }
							isUploading={ isUploading }
						>
							<div className="fields__media-edit-expanded-preview">
								<VStack
									spacing={ 0 }
									alignment="center"
									justify="center"
									className="fields__media-edit-expanded-preview-stack"
								>
									{ ( ! isBlob || hasPreviewImage ) && (
										<MediaPreview
											attachment={ attachment }
										/>
									) }
								</VStack>
							</div>
						</MediaPickerButton>
						{ ! isBlob && (
							<div className="fields__media-edit-expanded-overlay">
								<HStack
									className="fields__media-edit-expanded-actions"
									spacing={ 0 }
									alignment="flex-end"
									expanded={ false }
								>
									{ multiple && allItems.length > 1 && (
										<MoveButtons
											itemId={ attachmentNumericId }
											index={ index }
											totalItems={ allItems.length }
											isUploading={ isUploading }
											moveItem={ moveItem }
											orientation="horizontal"
										/>
									) }
									<Button
										__next40pxDefaultSize
										icon={ closeSmall }
										label={ __( 'Remove' ) }
										size="small"
										disabled={ isUploading }
										accessibleWhenDisabled
										tooltipPosition="top"
										onClick={ (
											event: React.MouseEvent< HTMLButtonElement >
										) => {
											event.stopPropagation();
											removeItem( attachmentNumericId );
										} }
									/>
								</HStack>
							</div>
						) }
					</AnimatedMediaItem>
				);
			} ) }
			{ ( multiple || ! allItems?.length ) && (
				<MediaEditPlaceholder
					open={ () => {
						setTargetItemId( undefined );
						open();
					} }
					label={ addButtonLabel }
					onFilesDrop={ onFilesDrop }
					isUploading={ isUploading }
				/>
			) }
		</div>
	);
}

function CompactMediaEditAttachments( {
	allItems,
	addButtonLabel,
	multiple,
	removeItem,
	moveItem,
	open,
	onFilesDrop,
	isUploading,
	setTargetItemId,
}: MediaEditAttachmentsProps ) {
	return (
		<>
			{ !! allItems?.length && (
				<div
					className={ clsx( 'fields__media-edit-compact-group', {
						'is-single': allItems.length === 1,
					} ) }
				>
					<VStack spacing={ 0 }>
						{ allItems.map( ( attachment, index ) => {
							const isBlob = isBlobURL( attachment.source_url );
							const showMoveButtons =
								multiple && allItems.length > 1;
							const attachmentNumericId = attachment.id as number;
							return (
								<AnimatedMediaItem
									key={ attachment.id }
									index={ index }
									className="fields__media-edit-compact"
								>
									<MediaPickerButton
										open={ () => {
											setTargetItemId(
												attachmentNumericId
											);
											open();
										} }
										label={ __( 'Replace' ) }
										showTooltip
										onFilesDrop={ onFilesDrop }
										attachment={ attachment }
										isUploading={ isUploading }
									>
										<>
											<MediaPreview
												attachment={ attachment }
											/>
											{ ! isBlob && (
												<MediaTitle
													attachment={
														attachment as Attachment< 'view' >
													}
												/>
											) }
										</>
									</MediaPickerButton>
									{ ! isBlob && (
										<HStack
											className="fields__media-edit-compact-movers"
											spacing={ 0 }
											alignment="flex-end"
											expanded={ false }
										>
											{ showMoveButtons && (
												<MoveButtons
													itemId={
														attachmentNumericId
													}
													index={ index }
													totalItems={
														allItems.length
													}
													isUploading={ isUploading }
													moveItem={ moveItem }
													orientation="vertical"
												/>
											) }
											<Button
												__next40pxDefaultSize
												icon={ closeSmall }
												label={ __( 'Remove' ) }
												size="small"
												disabled={ isUploading }
												accessibleWhenDisabled
												tooltipPosition="top"
												onClick={ (
													event: React.MouseEvent< HTMLButtonElement >
												) => {
													event.stopPropagation();
													removeItem(
														attachmentNumericId
													);
												} }
											/>
										</HStack>
									) }
								</AnimatedMediaItem>
							);
						} ) }
					</VStack>
				</div>
			) }
			{ ( multiple || ! allItems?.length ) && (
				<MediaEditPlaceholder
					open={ () => {
						setTargetItemId( undefined );
						open();
					} }
					label={ addButtonLabel }
					onFilesDrop={ onFilesDrop }
					isUploading={ isUploading }
				/>
			) }
		</>
	);
}

/**
 * A media edit control component that provides a media picker UI with upload functionality
 * for selecting WordPress media attachments. Supports both the traditional WordPress media
 * library and the experimental DataViews media modal.
 *
 * This component is intended to be used as the `Edit` property of a field definition when
 * registering fields with `registerEntityField` from `@wordpress/editor`.
 *
 * @template Item - The type of the item being edited.
 *
 * @param {MediaEditProps<Item>} props                       - The component props.
 * @param {Item}                 props.data                  - The item being edited.
 * @param {Object}               props.field                 - The field configuration with getValue and setValue methods.
 * @param {Function}             props.onChange              - Callback function when the media selection changes.
 * @param {string[]}             [props.allowedTypes]        - Array of allowed media types. Default `['image']`.
 * @param {boolean}              [props.multiple]            - Whether to allow multiple media selections. Default `false`.
 * @param {boolean}              [props.hideLabelFromVision] - Whether the label should be hidden from vision.
 * @param {boolean}              [props.isExpanded]          - Whether to render in an expanded form. Default `false`.
 *
 * @return {React.JSX.Element} The media edit control component.
 *
 * @example
 * ```tsx
 * import { MediaEdit } from '@wordpress/fields';
 * import type { DataFormControlProps } from '@wordpress/dataviews';
 *
 * const featuredImageField = {
 *   id: 'featured_media',
 *   type: 'media',
 *   label: 'Featured Image',
 *   Edit: (props: DataFormControlProps<MyPostType>) => (
 *     <MediaEdit
 *       {...props}
 *       allowedTypes={['image']}
 *     />
 *   ),
 * };
 * ```
 */
export default function MediaEdit< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	allowedTypes = [ 'image' ],
	multiple,
	isExpanded,
	validity,
}: MediaEditProps< Item > ) {
	const value = field.getValue( { item: data } );
	const [ isTouched, setIsTouched ] = useState( false );
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const [ customValidity, setCustomValidity ] = useState<
		| { type: 'valid' | 'validating' | 'invalid'; message?: string }
		| undefined
	>( undefined );
	// Listen for invalid event (e.g., form submission, reportValidity())
	// to show validation messages even before blur.
	useEffect( () => {
		const validityTarget = validityTargetRef.current;
		const handler = () => {
			setIsTouched( true );
		};
		validityTarget?.addEventListener( 'invalid', handler );
		return () => validityTarget?.removeEventListener( 'invalid', handler );
	}, [] );
	const attachments = useSelect(
		( select ) => {
			if ( ! value ) {
				return null;
			}
			const normalizedValue = normalizeValue( value );
			// Sorted IDs ensure stable cache key, avoiding
			// unnecessary new requests on reorder.
			const sortedIds = normalizedValue.toSorted( ( a, b ) => a - b );
			const { getEntityRecords } = select( coreStore );
			return getEntityRecords( 'postType', 'attachment', {
				include: sortedIds,
			} ) as Attachment< 'view' >[] | null;
		},
		[ value ]
	);
	// Keep previous attachments during null transitions. When value changes,
	// useSelect briefly returns null while the new query resolves. For pure
	// reorders (same IDs), we fall back to the cached list to avoid a visual
	// flash in compact mode. For replacements/uploads (new IDs not in cache),
	// we let attachments be null as normal.
	const stableAttachmentsRef = useRef< Attachment< 'view' >[] | null >(
		null
	);
	if ( attachments !== null ) {
		stableAttachmentsRef.current = attachments;
	}
	let stableAttachments = attachments;
	if ( attachments === null && stableAttachmentsRef.current && value ) {
		const stableIds = new Set(
			stableAttachmentsRef.current.map( ( a ) => a.id )
		);
		if ( normalizeValue( value ).every( ( id ) => stableIds.has( id ) ) ) {
			stableAttachments = stableAttachmentsRef.current;
		}
	}
	// Reorder attachments to match value order.
	const orderedAttachments = useMemo( () => {
		if ( ! stableAttachments ) {
			return null;
		}
		const normalizedValue = normalizeValue( value );
		const attachmentMap = new Map(
			stableAttachments.map( ( a ) => [ a.id, a ] )
		);
		return normalizedValue
			.map( ( id ) => attachmentMap.get( id ) )
			.filter( ( a ): a is Attachment< 'view' > => a !== undefined );
	}, [ stableAttachments, value ] );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { receiveEntityRecords } = useDispatch( coreStore );
	// Support one upload action at a time for now.
	const [ targetItemId, setTargetItemId ] = useState< number >();
	// Deferred open: the legacy class-based MediaUpload reads props
	// imperatively when `open()` is called, so calling it in the same
	// handler as `setTargetItemId()` would open the modal with stale
	// `value`/`multiple` props. Setting a pending flag defers the open
	// until after the next render when props are up to date.
	const openModalRef = useRef< () => void >( undefined );
	const [ pendingOpen, setPendingOpen ] = useState( false );
	const [ blobs, setBlobs ] = useState< string[] >( [] );
	useEffect( () => {
		if ( pendingOpen ) {
			setPendingOpen( false );
			openModalRef.current?.();
		}
	}, [ pendingOpen ] );
	const onChangeControl = useCallback(
		( newValue: number | number[] | undefined ) =>
			onChange( field.setValue( { item: data, value: newValue } ) ),
		[ data, field, onChange ]
	);
	const removeItem = useCallback(
		( itemId: number ) => {
			const currentIds = normalizeValue( value );
			const newIds = currentIds.filter( ( id ) => id !== itemId );
			// Mark as touched to immediately show any validation error.
			setIsTouched( true );
			onChangeControl( newIds.length ? newIds : undefined );
		},
		[ value, onChangeControl ]
	);
	const moveItem = useCallback(
		( itemId: number, direction: 'up' | 'down' ) => {
			if ( ! orderedAttachments ) {
				return;
			}
			const currentIds = orderedAttachments.map( ( a ) => a.id );
			const index = currentIds.indexOf( itemId );
			const newIndex = direction === 'up' ? index - 1 : index + 1;
			[ currentIds[ index ], currentIds[ newIndex ] ] = [
				currentIds[ newIndex ],
				currentIds[ index ],
			];
			onChangeControl( currentIds );
		},
		[ orderedAttachments, onChangeControl ]
	);
	const onFilesDrop = useCallback(
		( files: File[], _targetItemId?: number ) => {
			setTargetItemId( _targetItemId );
			uploadMedia( {
				allowedTypes: allowedTypes?.length ? allowedTypes : undefined,
				filesList: files,
				onFileChange( uploadedMedia: any[] ) {
					const blobUrls = uploadedMedia
						.filter( ( item ) => isBlobURL( item.url ) )
						.map( ( item ) => item.url );
					setBlobs( blobUrls );
					// Wait for all uploads to complete before updating value.
					if ( !! blobUrls.length ) {
						return;
					}
					// `uploadMedia` creates attachments via `apiFetch`
					// outside the core-data store, so invalidate
					// all attachment queries to keep them fresh for
					// other components that rely on core-data.
					receiveEntityRecords(
						'postType',
						'attachment',
						[],
						undefined,
						true
					);
					const uploadedIds = uploadedMedia.map(
						( item ) => item.id
					);
					if ( ! multiple ) {
						onChangeControl( uploadedIds[ 0 ] );
						setTargetItemId( undefined );
						return;
					}
					const currentValue = normalizeValue( value );
					// Dropped on placeholder: append new items.
					if ( _targetItemId === undefined ) {
						onChangeControl( [ ...currentValue, ...uploadedIds ] );
					} else {
						// Dropped on existing item: insert at that position.
						const newValue = [ ...currentValue ];
						newValue.splice(
							currentValue.indexOf( _targetItemId ),
							1,
							...uploadedIds
						);
						onChangeControl( newValue );
					}
					setTargetItemId( undefined );
				},
				onError( error: Error ) {
					setTargetItemId( undefined );
					setBlobs( [] );
					createErrorNotice( error.message, { type: 'snackbar' } );
				},
				multiple: !! multiple,
			} );
		},
		[
			allowedTypes,
			value,
			multiple,
			createErrorNotice,
			onChangeControl,
			receiveEntityRecords,
		]
	);
	const addButtonLabel =
		field.placeholder ||
		( multiple ? __( 'Choose files' ) : __( 'Choose file' ) );
	// Merge real attachments with any existing blob items that are being uploaded.
	const allItems: Array< MediaEditAttachment > | null = useMemo( () => {
		if ( ! blobs.length ) {
			return orderedAttachments;
		}
		const items: Array< MediaEditAttachment > = [
			...( orderedAttachments || [] ),
		];
		const blobItems = blobs.map( ( url ) => ( {
			id: url,
			source_url: url,
			mime_type: getBlobTypeByURL( url ),
		} ) );
		if ( targetItemId !== undefined ) {
			// When files are dropped in existing media item, place the blobs at that item.
			const targetIndex = items.findIndex(
				( a ) => a.id === targetItemId
			);
			items.splice( targetIndex, 1, ...blobItems );
		} else {
			items.push( ...blobItems );
		}
		return items;
	}, [ orderedAttachments, targetItemId, blobs ] );
	useEffect( () => {
		if ( ! isTouched ) {
			return;
		}
		const input = validityTargetRef.current;
		if ( ! input ) {
			return;
		}

		if ( validity ) {
			const customValidityResult = validity?.custom;
			setCustomValidity( customValidityResult );

			// Set custom validity on hidden input for HTML5 form validation.
			if ( customValidityResult?.type === 'invalid' ) {
				input.setCustomValidity(
					customValidityResult.message || __( 'Invalid' )
				);
			} else {
				input.setCustomValidity( '' ); // Clear validity.
			}
		} else {
			// Clear any previous validation.
			input.setCustomValidity( '' );
			setCustomValidity( undefined );
		}
	}, [ isTouched, field.isValid, validity ] );
	const onBlur = useCallback(
		( event: React.FocusEvent< HTMLElement > ) => {
			if ( isTouched ) {
				return;
			}
			if (
				! event.relatedTarget ||
				! event.currentTarget.contains( event.relatedTarget )
			) {
				setIsTouched( true );
			}
		},
		[ isTouched ]
	);
	return (
		<div onBlur={ onBlur }>
			<fieldset className="fields__media-edit" data-field-id={ field.id }>
				<ConditionalMediaUpload
					onSelect={ ( selectedMedia: any ) => {
						if ( ! multiple ) {
							onChangeControl( selectedMedia.id );
							setTargetItemId( undefined );
							return;
						}
						const newIds = Array.isArray( selectedMedia )
							? selectedMedia.map( ( m: any ) => m.id )
							: [ selectedMedia.id ];
						const currentValue = normalizeValue( value );
						if ( ! currentValue.length ) {
							onChangeControl( newIds );
						} else if ( targetItemId === undefined ) {
							// Placeholder clicked: keep existing items that are
							// still selected, then append newly selected items.
							const existingItems = currentValue.filter( ( id ) =>
								newIds.includes( id )
							);
							const newItems = newIds.filter(
								( id ) => ! currentValue.includes( id )
							);
							onChangeControl( [
								...existingItems,
								...newItems,
							] );
						} else if ( selectedMedia.id !== targetItemId ) {
							// Remove selected item from its old position, if it
							// already exists in the value.
							const filtered = currentValue.filter(
								( id ) => id !== selectedMedia.id
							);
							// Replace the clicked item with the selected one.
							onChangeControl(
								filtered.map( ( id ) =>
									id === targetItemId ? selectedMedia.id : id
								)
							);
						}
						setTargetItemId( undefined );
					} }
					onClose={ () => setTargetItemId( undefined ) }
					allowedTypes={ allowedTypes }
					// When replacing an existing item, pass only that item's ID
					// and open in single-select mode so the user picks exactly
					// one replacement, even if `multiple` is true.
					value={ targetItemId !== undefined ? targetItemId : value }
					multiple={ multiple && targetItemId === undefined }
					title={ field.label }
					render={ ( { open }: any ) => {
						// Keep a ref to the latest `open` so the deferred effect can call it.
						openModalRef.current = open;
						const AttachmentsComponent = isExpanded
							? ExpandedMediaEditAttachments
							: CompactMediaEditAttachments;
						return (
							<VStack spacing={ 2 }>
								{ field.label &&
									( hideLabelFromVision ? (
										<VisuallyHidden as="legend">
											{ field.label }
										</VisuallyHidden>
									) : (
										<BaseControl.VisualLabel
											as="legend"
											style={ { marginBottom: 0 } }
										>
											{ field.label }
										</BaseControl.VisualLabel>
									) ) }
								<AttachmentsComponent
									allItems={ allItems }
									addButtonLabel={ addButtonLabel }
									multiple={ multiple }
									removeItem={ removeItem }
									moveItem={ moveItem }
									open={ () => setPendingOpen( true ) }
									onFilesDrop={ onFilesDrop }
									isUploading={ !! blobs.length }
									setTargetItemId={ setTargetItemId }
								/>
								{ field.description && (
									<Text variant="muted">
										{ field.description }
									</Text>
								) }
							</VStack>
						);
					} }
				/>
			</fieldset>
			{ /* Visually hidden text input for validation. */ }
			<VisuallyHidden>
				<input
					type="text"
					ref={ validityTargetRef }
					value={ value ?? '' }
					tabIndex={ -1 }
					aria-hidden="true"
					onChange={ () => {} }
				/>
			</VisuallyHidden>
			{ customValidity && (
				<div aria-live="polite">
					<p
						className={ clsx(
							'components-validated-control__indicator',
							{
								'is-invalid': customValidity.type === 'invalid',
								'is-valid': customValidity.type === 'valid',
							}
						) }
					>
						<Icon
							className="components-validated-control__indicator-icon"
							icon={ errorIcon }
							size={ 16 }
							fill="currentColor"
						/>
						{ customValidity.message }
					</p>
				</div>
			) }
		</div>
	);
}
