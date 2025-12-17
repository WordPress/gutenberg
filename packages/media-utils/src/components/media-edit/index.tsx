/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalText as Text,
	__experimentalTruncate as Truncate,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore, type Attachment } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { archive, audio, video, file } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import { MediaUploadModal } from '../media-upload-modal';

export interface MediaEditProps< Item > extends DataFormControlProps< Item > {
	/**
	 * Array of allowed media types (e.g., ['image', 'video']).
	 *
	 * @default ['image']
	 */
	allowedTypes?: string[];
	/**
	 * Placeholder text when no media is selected.
	 *
	 * @default 'Choose file'
	 */
	placeholder?: string;
	/**
	 * Help text.
	 */
	help?: string;
	/**
	 * Whether to allow multiple media selections.
	 *
	 * @default false
	 */
	multiple?: boolean;
}

/**
 * Conditional Media component that uses MediaUploadModal when experiment is enabled,
 * otherwise falls back to media-utils MediaUpload.
 *
 * @param root0        Component props.
 * @param root0.render Render prop function that receives { open } object.
 * @return The component.
 */
function ConditionalMediaUpload( { render, ...props }: any ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	if ( ( window as any ).__experimentalDataViewsMediaModal ) {
		return (
			<>
				{ render && render( { open: () => setIsModalOpen( true ) } ) }
				{ isModalOpen && (
					<MediaUploadModal
						{ ...props }
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
	return <MediaUpload { ...props } render={ render } />;
}

function MediaPickerButton( {
	open,
	children,
	label,
}: {
	open: () => void;
	children: React.ReactNode;
	label: string;
} ) {
	return (
		<div
			className="fields-controls__media-picker-button"
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
				className="fields-controls__media-thumbnail"
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
			<Truncate
				className="fields-controls__media-filename"
				title={ attachmentTitle }
			>
				{ attachmentTitle }
			</Truncate>
		</>
	);
}

/**
 * A media edit control component designed to be used with the Fields API (`@wordpress/dataviews`).
 * Provides a media picker UI with upload functionality for selecting WordPress media attachments.
 * Supports both the traditional WordPress media library and the experimental DataViews media modal.
 *
 * This component is intended to be used as the `Edit` property of a field definition when
 * registering fields with `registerEntityField` from `@wordpress/editor`.
 *
 * @template Item - The type of the item being edited.
 *
 * @param {MediaEditProps<Item>} props                - The component props.
 * @param {Item}                 props.data           - The item being edited.
 * @param {Object}               props.field          - The field configuration with getValue and setValue methods.
 * @param {Function}             props.onChange       - Callback function when the media selection changes.
 * @param {string[]}             [props.allowedTypes] - Array of allowed media types. Default `['image']`.
 * @param {string}               [props.placeholder]  - Placeholder text when no media is selected. Default `'Choose file'`.
 * @param {boolean}              [props.multiple]     - Whether to allow multiple media selections. Default `false`.
 * @param {string}               [props.help]         - Help text.
 *
 * @return {JSX.Element} The media edit control component.
 *
 * @example
 * ```tsx
 * import { MediaEdit } from '@wordpress/media-utils';
 * import type { MediaEditProps } from '@wordpress/media-utils';
 *
 * const featuredImageField = {
 *   id: 'featured_media',
 *   type: 'media',
 *   label: 'Featured Image',
 *   Edit: (props: MediaEditProps<MyPostType>) => (
 *     <MediaEdit
 *       {...props}
 *       allowedTypes={['image']}
 *       placeholder="Choose featured image…"
 *       help="Upload an image to represent this post"
 *     />
 *   ),
 * };
 * ```
 */
export default function MediaEdit< Item >( {
	data,
	field,
	onChange,
	allowedTypes = [ 'image' ],
	placeholder = __( 'Choose file' ),
	help,
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
		( newValue: number | number[] ) =>
			onChange( field.setValue( { item: data, value: newValue } ) ),
		[ data, field, onChange ]
	);
	const removeItem = ( itemId: number ) => {
		const currentIds = Array.isArray( value ) ? value : [ value ];
		const newIds = currentIds.filter( ( id ) => id !== itemId );
		onChangeControl( newIds.length ? newIds : 0 );
	};
	return (
		<fieldset className="fields-controls__media">
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
						: placeholder;
					return (
						<VStack spacing={ 2 }>
							{ !! attachments?.length && (
								<VStack spacing={ 2 }>
									{ attachments.map( ( attachment ) => (
										<div
											key={ attachment.id }
											className="fields-controls__media-row"
										>
											<MediaPickerButton
												open={ open }
												label={ __( 'Replace' ) }
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
												className="fields-controls__media-remove"
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
									<span className="fields-controls__media-placeholder">
										{ addButtonLabel }
									</span>
								</MediaPickerButton>
							) }

							{ help && <Text variant="muted">{ help }</Text> }
						</VStack>
					);
				} }
			/>
		</fieldset>
	);
}
