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
import { __ } from '@wordpress/i18n';
import {
	archive,
	audio,
	video,
	file,
	closeSmall,
	error as errorIcon,
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

const { MediaUploadModal } = unlock( mediaUtilsPrivateApis );

type BlobItem = {
	id: string;
	source_url: string;
	mime_type: string | undefined;
	alt_text?: string;
};

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
			className="fields__media-edit-picker-button"
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
	return <Tooltip text={ label }>{ mediaPickerButton }</Tooltip>;
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
	open: () => void;
	onFilesDrop: ( files: File[], attachmentId?: number ) => void;
	isUploading: boolean;
}

function ExpandedMediaEditAttachments( {
	allItems,
	addButtonLabel,
	multiple,
	removeItem,
	open,
	onFilesDrop,
	isUploading,
}: MediaEditAttachmentsProps ) {
	return (
		<div
			className={ clsx( 'fields__media-edit-expanded', {
				'is-multiple': multiple,
				'is-single': ! multiple,
				'is-empty': ! allItems?.length,
			} ) }
		>
			{ allItems?.map( ( attachment ) => {
				const hasPreviewImage =
					attachment.mime_type?.startsWith( 'image' );
				const isBlob = isBlobURL( attachment.source_url );
				return (
					<div
						key={ attachment.id }
						className={ clsx( 'fields__media-edit-expanded-item', {
							'has-preview-image': hasPreviewImage,
						} ) }
					>
						<MediaPickerButton
							open={ open }
							label={ __( 'Replace' ) }
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
									{ ! isBlob &&
										( ! hasPreviewImage ? (
											<MediaTitle
												attachment={
													attachment as Attachment< 'view' >
												}
											/>
										) : (
											<div className="fields__media-edit-expanded-overlay">
												<div className="fields__media-edit-expanded-title">
													<MediaTitle
														attachment={
															attachment as Attachment< 'view' >
														}
													/>
												</div>
											</div>
										) ) }
								</VStack>
							</div>
						</MediaPickerButton>
						{ ! isBlob && (
							<div className="fields__media-edit-expanded-overlay">
								<Button
									__next40pxDefaultSize
									className="fields__media-edit-expanded-remove"
									icon={ closeSmall }
									label={ __( 'Remove' ) }
									size="small"
									disabled={ isUploading }
									accessibleWhenDisabled
									onClick={ (
										event: React.MouseEvent< HTMLButtonElement >
									) => {
										event.stopPropagation();
										removeItem( attachment.id as number );
									} }
								/>
							</div>
						) }
					</div>
				);
			} ) }
			{ ( multiple || ! allItems?.length ) && (
				<MediaEditPlaceholder
					open={ open }
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
	open,
	onFilesDrop,
	isUploading,
}: MediaEditAttachmentsProps ) {
	return (
		<>
			{ !! allItems?.length && (
				<VStack spacing={ 2 }>
					{ allItems.map( ( attachment ) => {
						const isBlob = isBlobURL( attachment.source_url );
						return (
							<div
								key={ attachment.id }
								className="fields__media-edit-compact"
							>
								<MediaPickerButton
									open={ open }
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
								<Button
									__next40pxDefaultSize
									className="fields__media-edit-remove"
									text={ __( 'Remove' ) }
									variant="secondary"
									disabled={ isUploading }
									accessibleWhenDisabled
									onClick={ (
										event: React.MouseEvent< HTMLButtonElement >
									) => {
										event.stopPropagation();
										if (
											typeof attachment.id === 'number'
										) {
											removeItem( attachment.id );
										}
									} }
								/>
							</div>
						);
					} ) }
				</VStack>
			) }
			{ ( multiple || ! allItems?.length ) && (
				<MediaEditPlaceholder
					open={ open }
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
 * @return {JSX.Element} The media edit control component.
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
			const normalizedValue = Array.isArray( value ) ? value : [ value ];
			const { getEntityRecords } = select( coreStore );
			return getEntityRecords( 'postType', 'attachment', {
				include: normalizedValue,
			} ) as Attachment< 'view' >[] | null;
		},
		[ value ]
	);
	const { createErrorNotice } = useDispatch( noticesStore );
	// Support one upload action at a time for now.
	const [ replacementId, setReplacementId ] = useState< number >();
	const [ blobs, setBlobs ] = useState< string[] >( [] );
	const onChangeControl = useCallback(
		( newValue: number | number[] | undefined ) =>
			onChange( field.setValue( { item: data, value: newValue } ) ),
		[ data, field, onChange ]
	);
	const removeItem = useCallback(
		( itemId: number ) => {
			const currentIds = Array.isArray( value ) ? value : [ value ];
			const newIds = currentIds.filter( ( id ) => id !== itemId );
			// Mark as touched to immediately show any validation error.
			setIsTouched( true );
			onChangeControl( newIds.length ? newIds : undefined );
		},
		[ value, onChangeControl ]
	);
	const onFilesDrop = useCallback(
		( files: File[], _replacementId?: number ) => {
			uploadMedia( {
				allowedTypes: allowedTypes?.length ? allowedTypes : undefined,
				filesList: files,
				onFileChange( uploadedMedia: any[] ) {
					setReplacementId( _replacementId );
					const { blobItems, uploadedItems } = uploadedMedia.reduce(
						( accumulator, item ) => {
							if ( isBlobURL( item.url ) ) {
								accumulator.blobItems.push( item.url );
							} else {
								accumulator.uploadedItems.push( item.id );
							}
							return accumulator;
						},
						{
							blobItems: [] as string[],
							uploadedItems: [] as number[],
						}
					);
					setBlobs( blobItems );
					// If all uploads are complete reset the replacementId.
					if ( uploadedItems.length === uploadedMedia.length ) {
						setReplacementId( undefined );
					}
					if ( ! uploadedItems.length ) {
						return;
					}
					if ( ! multiple ) {
						onChangeControl( uploadedItems[ 0 ] );
						return;
					}
					if ( ! value ) {
						onChangeControl( uploadedItems );
						return;
					}
					const normalizedValue = Array.isArray( value )
						? value
						: [ value ];
					const newIds = [
						...( _replacementId
							? normalizedValue.filter(
									( id: any ) => id !== _replacementId
							  )
							: normalizedValue ),
						...uploadedItems,
					];
					onChangeControl( newIds );
				},
				onError( error: Error ) {
					setReplacementId( undefined );
					setBlobs( [] );
					createErrorNotice( error.message, { type: 'snackbar' } );
				},
				multiple: !! multiple,
			} );
		},
		[ allowedTypes, value, multiple, createErrorNotice, onChangeControl ]
	);
	const addButtonLabel =
		field.placeholder ||
		( multiple ? __( 'Choose files' ) : __( 'Choose file' ) );
	// Merge real attachments with any existing blob items that are being uploaded.
	const allItems: Array< MediaEditAttachment > | null = useMemo( () => {
		if ( ! blobs.length ) {
			return attachments;
		}
		const items: Array< MediaEditAttachment > = [
			...( attachments || [] ),
		];
		const blobItems = blobs.map( ( url ) => ( {
			id: url,
			source_url: url,
			mime_type: getBlobTypeByURL( url ),
		} ) );
		const replacementIndex = items.findIndex(
			( a ) => a.id === replacementId
		);
		// Place blobs at the replacement index, when files
		// dropped in existing media item.
		if ( replacementIndex !== -1 ) {
			return [
				...items.slice( 0, replacementIndex ),
				...blobItems,
				...items.slice( replacementIndex + 1 ),
			];
		}
		items.push( ...blobItems );
		return items;
	}, [ attachments, replacementId, blobs ] );
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
				input.setCustomValidity( '' ); // Clear validity
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
						if ( multiple ) {
							const newIds = Array.isArray( selectedMedia )
								? selectedMedia.map( ( m: any ) => m.id )
								: [ selectedMedia.id ];
							onChangeControl( newIds );
						} else {
							onChangeControl( selectedMedia.id );
						}
					} }
					allowedTypes={ allowedTypes }
					value={ value }
					multiple={ multiple }
					title={ field.label }
					render={ ( { open }: any ) => {
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
										<BaseControl.VisualLabel as="legend">
											{ field.label }
										</BaseControl.VisualLabel>
									) ) }
								<AttachmentsComponent
									allItems={ allItems }
									addButtonLabel={ addButtonLabel }
									multiple={ multiple }
									removeItem={ removeItem }
									open={ open }
									onFilesDrop={ onFilesDrop }
									isUploading={ !! blobs.length }
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
