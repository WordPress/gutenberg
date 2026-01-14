/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalText as Text,
	__experimentalTruncate as Truncate,
	__experimentalVStack as VStack,
	BaseControl,
	Tooltip,
	VisuallyHidden,
} from '@wordpress/components';
import { store as coreStore, type Attachment } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { archive, audio, video, file } from '@wordpress/icons';
import {
	MediaUpload,
	privateApis as mediaUtilsPrivateApis,
} from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import type { MediaEditProps } from '../../types';

const { MediaUploadModal } = unlock( mediaUtilsPrivateApis );

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
}: {
	open: () => void;
	children: React.ReactNode;
	label: string;
	showTooltip?: boolean;
} ) {
	const mediaPickerButton = (
		<div
			className="fields__media-edit-picker-button"
			role="button"
			tabIndex={ 0 }
			onClick={ open }
			onKeyDown={ ( event ) => {
				if ( event.key === 'Enter' || event.key === ' ' ) {
					event.preventDefault();
					open();
				}
			} }
			aria-label={ label }
		>
			{ children }
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

function MediaPreview( {
	url,
	attachment,
}: {
	url: string;
	attachment: Attachment< 'view' > | null;
} ) {
	if ( ! attachment ) {
		return null;
	}
	const attachmentTitle = attachment.title.rendered;
	const mimeType = attachment.mime_type;
	let preview: JSX.Element = <Icon icon={ file } />;
	if ( mimeType.startsWith( 'image/' ) ) {
		preview = (
			<img
				className="fields__media-edit-thumbnail"
				alt={ attachment.alt_text || '' }
				src={ url }
			/>
		);
	} else if ( mimeType.startsWith( 'audio/' ) ) {
		preview = <Icon icon={ audio } />;
	} else if ( mimeType.startsWith( 'video/' ) ) {
		preview = <Icon icon={ video } />;
	} else if ( archiveMimeTypes.includes( mimeType ) ) {
		preview = <Icon icon={ archive } />;
	}
	return (
		<>
			{ preview }
			<Truncate className="fields__media-edit-filename">
				{ attachmentTitle }
			</Truncate>
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
}: MediaEditProps< Item > ) {
	const value = field.getValue( { item: data } );
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
	const onChangeControl = useCallback(
		( newValue: number | number[] | undefined ) =>
			onChange( field.setValue( { item: data, value: newValue } ) ),
		[ data, field, onChange ]
	);
	const removeItem = ( itemId: number ) => {
		const currentIds = Array.isArray( value ) ? value : [ value ];
		const newIds = currentIds.filter( ( id ) => id !== itemId );
		onChangeControl( newIds.length ? newIds : undefined );
	};
	return (
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
					const addButtonLabel = attachments?.length
						? __( 'Add files' )
						: field.placeholder || __( 'Choose file' );
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
							{ !! attachments?.length && (
								<VStack spacing={ 2 }>
									{ attachments.map( ( attachment ) => (
										<div
											key={ attachment.id }
											className="fields__media-edit-row"
										>
											<MediaPickerButton
												open={ open }
												label={ __( 'Replace' ) }
												showTooltip
											>
												<MediaPreview
													url={
														attachment.source_url
													}
													attachment={ attachment }
												/>
											</MediaPickerButton>
											<Button
												__next40pxDefaultSize
												className="fields__media-edit-remove"
												text={ __( 'Remove' ) }
												variant="secondary"
												onClick={ (
													event: React.MouseEvent< HTMLButtonElement >
												) => {
													event.stopPropagation();
													removeItem( attachment.id );
												} }
											/>
										</div>
									) ) }
								</VStack>
							) }
							{ ( multiple || ! attachments?.length ) && (
								<MediaPickerButton
									open={ open }
									label={ addButtonLabel }
								>
									<span className="fields__media-edit-placeholder">
										{ addButtonLabel }
									</span>
								</MediaPickerButton>
							) }

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
	);
}
