/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	FormFileUpload,
	Placeholder,
	DropZone,
	withFilters,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { keyboardReturn } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import URLPopover from '../url-popover';
import { store as blockEditorStore } from '../../store';

const InsertFromURLPopover = ( { src, onChange, onSubmit, onClose } ) => (
	<URLPopover onClose={ onClose }>
		<form
			className="block-editor-media-placeholder__url-input-form"
			onSubmit={ onSubmit }
		>
			<input
				className="block-editor-media-placeholder__url-input-field"
				type="url"
				aria-label={ __( 'URL' ) }
				placeholder={ __( 'Paste or type URL' ) }
				onChange={ onChange }
				value={ src }
			/>
			<Button
				className="block-editor-media-placeholder__url-input-submit-button"
				icon={ keyboardReturn }
				label={ __( 'Apply' ) }
				type="submit"
			/>
		</form>
	</URLPopover>
);

export function MediaPlaceholder( {
	value = {},
	allowedTypes,
	className,
	icon,
	labels = {},
	mediaPreview,
	notices,
	isAppender,
	accept,
	addToGallery,
	multiple = false,
	dropZoneUIOnly,
	disableDropZone,
	disableMediaButtons,
	onError,
	onSelect,
	onCancel,
	onSelectURL,
	onDoubleClick,
	onFilesPreUpload = noop,
	onHTMLDrop = noop,
	children,
} ) {
	const mediaUpload = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().mediaUpload;
	}, [] );
	const [ src, setSrc ] = useState( '' );
	const [ isURLInputVisible, setIsURLInputVisible ] = useState( false );

	useEffect( () => {
		setSrc( value?.src ?? '' );
	}, [ value?.src ] );

	const onlyAllowsImages = () => {
		if ( ! allowedTypes || allowedTypes.length === 0 ) {
			return false;
		}

		return allowedTypes.every(
			( allowedType ) =>
				allowedType === 'image' || allowedType.startsWith( 'image/' )
		);
	};

	const onChangeSrc = ( event ) => {
		setSrc( event.target.value );
	};

	const openURLInput = () => {
		setIsURLInputVisible( true );
	};
	const closeURLInput = () => {
		setIsURLInputVisible( false );
	};

	const onSubmitSrc = ( event ) => {
		event.preventDefault();
		if ( src && onSelectURL ) {
			onSelectURL( src );
			closeURLInput();
		}
	};

	const onMediaLibrarySelection = ( files ) => {
		if ( addToGallery ) {
			onSelect( files, true );
			return;
		}
		onSelect( files );
	};

	const onFilesUpload = ( files ) => {
		if ( addToGallery ) {
			// Because the Gallery hands the files over to Image component InnerBlocks just
			// hand the handling of the files over to the Gallery
			onSelect( files );
			return;
		}
		onFilesPreUpload( files );
		let setMedia;
		if ( multiple ) {
			setMedia = onSelect;
		} else {
			setMedia = ( [ media ] ) => onSelect( media );
		}
		mediaUpload( {
			allowedTypes,
			filesList: files,
			onFileChange: setMedia,
			onError,
		} );
	};

	const onUpload = ( event ) => {
		onFilesUpload( event.target.files );
	};

	const renderPlaceholder = ( content, onClick ) => {
		let { instructions, title } = labels;

		if ( ! mediaUpload && ! onSelectURL ) {
			instructions = __(
				'To edit this block, you need permission to upload media.'
			);
		}

		if ( instructions === undefined || title === undefined ) {
			const typesAllowed = allowedTypes ?? [];

			const [ firstAllowedType ] = typesAllowed;
			const isOneType = 1 === typesAllowed.length;
			const isAudio = isOneType && 'audio' === firstAllowedType;
			const isImage = isOneType && 'image' === firstAllowedType;
			const isVideo = isOneType && 'video' === firstAllowedType;

			if ( instructions === undefined && mediaUpload ) {
				instructions = __(
					'Upload a media file or pick one from your media library.'
				);

				if ( isAudio ) {
					instructions = __(
						'Upload an audio file, pick one from your media library, or add one with a URL.'
					);
				} else if ( isImage ) {
					instructions = __(
						'Upload an image file, pick one from your media library, or add one with a URL.'
					);
				} else if ( isVideo ) {
					instructions = __(
						'Upload a video file, pick one from your media library, or add one with a URL.'
					);
				}
			}

			if ( title === undefined ) {
				title = __( 'Media' );

				if ( isAudio ) {
					title = __( 'Audio' );
				} else if ( isImage ) {
					title = __( 'Image' );
				} else if ( isVideo ) {
					title = __( 'Video' );
				}
			}
		}

		const placeholderClassName = classnames(
			'block-editor-media-placeholder',
			className,
			{
				'is-appender': isAppender,
			}
		);

		return (
			<Placeholder
				icon={ icon }
				label={ title }
				instructions={ instructions }
				className={ placeholderClassName }
				notices={ notices }
				onClick={ onClick }
				onDoubleClick={ onDoubleClick }
				preview={ mediaPreview }
			>
				{ content }
				{ children }
			</Placeholder>
		);
	};

	const renderDropZone = () => {
		if ( disableDropZone ) {
			return null;
		}

		return (
			<DropZone onFilesDrop={ onFilesUpload } onHTMLDrop={ onHTMLDrop } />
		);
	};

	const renderCancelLink = () => {
		return (
			onCancel && (
				<Button
					className="block-editor-media-placeholder__cancel-button"
					title={ __( 'Cancel' ) }
					isLink
					onClick={ onCancel }
				>
					{ __( 'Cancel' ) }
				</Button>
			)
		);
	};

	const renderUrlSelectionUI = () => {
		return (
			onSelectURL && (
				<div className="block-editor-media-placeholder__url-input-container">
					<Button
						className="block-editor-media-placeholder__button"
						onClick={ openURLInput }
						isPressed={ isURLInputVisible }
						isTertiary
					>
						{ __( 'Insert from URL' ) }
					</Button>
					{ isURLInputVisible && (
						<InsertFromURLPopover
							src={ src }
							onChange={ onChangeSrc }
							onSubmit={ onSubmitSrc }
							onClose={ closeURLInput }
						/>
					) }
				</div>
			)
		);
	};

	const renderMediaUploadChecked = () => {
		const mediaLibraryButton = (
			<MediaUpload
				addToGallery={ addToGallery }
				gallery={ multiple && onlyAllowsImages() }
				multiple={ multiple }
				onSelect={ onMediaLibrarySelection }
				allowedTypes={ allowedTypes }
				value={
					Array.isArray( value )
						? value.map( ( { id } ) => id )
						: value.id
				}
				render={ ( { open } ) => {
					return (
						<Button
							isTertiary
							onClick={ ( event ) => {
								event.stopPropagation();
								open();
							} }
						>
							{ __( 'Media Library' ) }
						</Button>
					);
				} }
			/>
		);

		if ( mediaUpload && isAppender ) {
			return (
				<>
					{ renderDropZone() }
					<FormFileUpload
						onChange={ onUpload }
						accept={ accept }
						multiple={ multiple }
						render={ ( { openFileDialog } ) => {
							const content = (
								<>
									<Button
										isPrimary
										className={ classnames(
											'block-editor-media-placeholder__button',
											'block-editor-media-placeholder__upload-button'
										) }
									>
										{ __( 'Upload' ) }
									</Button>
									{ mediaLibraryButton }
									{ renderUrlSelectionUI() }
									{ renderCancelLink() }
								</>
							);
							return renderPlaceholder( content, openFileDialog );
						} }
					/>
				</>
			);
		}

		if ( mediaUpload ) {
			const content = (
				<>
					{ renderDropZone() }
					<FormFileUpload
						isPrimary
						className={ classnames(
							'block-editor-media-placeholder__button',
							'block-editor-media-placeholder__upload-button'
						) }
						onChange={ onUpload }
						accept={ accept }
						multiple={ multiple }
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					{ mediaLibraryButton }
					{ renderUrlSelectionUI() }
					{ renderCancelLink() }
				</>
			);
			return renderPlaceholder( content );
		}

		return renderPlaceholder( mediaLibraryButton );
	};

	if ( dropZoneUIOnly || disableMediaButtons ) {
		if ( dropZoneUIOnly ) {
			deprecated( 'wp.blockEditor.MediaPlaceholder dropZoneUIOnly prop', {
				alternative: 'disableMediaButtons',
			} );
		}

		return <MediaUploadCheck>{ renderDropZone() }</MediaUploadCheck>;
	}

	return (
		<MediaUploadCheck
			fallback={ renderPlaceholder( renderUrlSelectionUI() ) }
		>
			{ renderMediaUploadChecked() }
		</MediaUploadCheck>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/media-placeholder/README.md
 */
export default withFilters( 'editor.MediaPlaceholder' )( MediaPlaceholder );
