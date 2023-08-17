/**
 * External dependencies
 */
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
import { keyboardReturn } from '@wordpress/icons';
import { pasteHandler } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import URLPopover from '../url-popover';
import { store as blockEditorStore } from '../../store';

const noop = () => {};

const InsertFromURLPopover = ( {
	src,
	onChange,
	onSubmit,
	onClose,
	popoverAnchor,
} ) => (
	<URLPopover anchor={ popoverAnchor } onClose={ onClose }>
		<form
			className="block-editor-media-placeholder__url-input-form"
			onSubmit={ onSubmit }
		>
			<input
				className="block-editor-media-placeholder__url-input-field"
				type="text"
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

const URLSelectionUI = ( {
	isURLInputVisible,
	src,
	onChangeSrc,
	onSubmitSrc,
	openURLInput,
	closeURLInput,
} ) => {
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	return (
		<div
			className="block-editor-media-placeholder__url-input-container"
			ref={ setPopoverAnchor }
		>
			<Button
				className="block-editor-media-placeholder__button"
				onClick={ openURLInput }
				isPressed={ isURLInputVisible }
				variant="tertiary"
			>
				{ __( 'Insert from URL' ) }
			</Button>
			{ isURLInputVisible && (
				<InsertFromURLPopover
					src={ src }
					onChange={ onChangeSrc }
					onSubmit={ onSubmitSrc }
					onClose={ closeURLInput }
					popoverAnchor={ popoverAnchor }
				/>
			) }
		</div>
	);
};

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
	handleUpload = true,
	disableDropZone,
	disableMediaButtons,
	onError,
	onSelect,
	onCancel,
	onSelectURL,
	onToggleFeaturedImage,
	onDoubleClick,
	onFilesPreUpload = noop,
	onHTMLDrop: deprecatedOnHTMLDrop,
	children,
	mediaLibraryButton,
	placeholder,
	style,
} ) {
	if ( deprecatedOnHTMLDrop ) {
		deprecated( 'wp.blockEditor.MediaPlaceholder onHTMLDrop prop', {
			since: '6.2',
			version: '6.4',
		} );
	}

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

	const onFilesUpload = ( files ) => {
		if ( ! handleUpload ) {
			return onSelect( files );
		}
		onFilesPreUpload( files );
		let setMedia;
		if ( multiple ) {
			if ( addToGallery ) {
				// Since the setMedia function runs multiple times per upload group
				// and is passed newMedia containing every item in its group each time, we must
				// filter out whatever this upload group had previously returned to the
				// gallery before adding and returning the image array with replacement newMedia
				// values.

				// Define an array to store urls from newMedia between subsequent function calls.
				let lastMediaPassed = [];
				setMedia = ( newMedia ) => {
					// Remove any images this upload group is responsible for (lastMediaPassed).
					// Their replacements are contained in newMedia.
					const filteredMedia = ( value ?? [] ).filter( ( item ) => {
						// If Item has id, only remove it if lastMediaPassed has an item with that id.
						if ( item.id ) {
							return ! lastMediaPassed.some(
								// Be sure to convert to number for comparison.
								( { id } ) => Number( id ) === Number( item.id )
							);
						}
						// Compare transient images via .includes since gallery may append extra info onto the url.
						return ! lastMediaPassed.some( ( { urlSlug } ) =>
							item.url.includes( urlSlug )
						);
					} );
					// Return the filtered media array along with newMedia.
					onSelect( filteredMedia.concat( newMedia ) );
					// Reset lastMediaPassed and set it with ids and urls from newMedia.
					lastMediaPassed = newMedia.map( ( media ) => {
						// Add everything up to '.fileType' to compare via .includes.
						const cutOffIndex = media.url.lastIndexOf( '.' );
						const urlSlug = media.url.slice( 0, cutOffIndex );
						return { id: media.id, urlSlug };
					} );
				};
			} else {
				setMedia = onSelect;
			}
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

	async function handleBlocksDrop( blocks ) {
		if ( ! blocks || ! Array.isArray( blocks ) ) {
			return;
		}

		function recursivelyFindMediaFromBlocks( _blocks ) {
			return _blocks.flatMap( ( block ) =>
				( block.name === 'core/image' ||
					block.name === 'core/audio' ||
					block.name === 'core/video' ) &&
				block.attributes.url
					? [ block ]
					: recursivelyFindMediaFromBlocks( block.innerBlocks )
			);
		}

		const mediaBlocks = recursivelyFindMediaFromBlocks( blocks );

		if ( ! mediaBlocks.length ) {
			return;
		}

		const uploadedMediaList = await Promise.all(
			mediaBlocks.map( ( block ) =>
				block.attributes.id
					? block.attributes
					: new Promise( ( resolve, reject ) => {
							window
								.fetch( block.attributes.url )
								.then( ( response ) => response.blob() )
								.then( ( blob ) =>
									mediaUpload( {
										filesList: [ blob ],
										additionalData: {
											title: block.attributes.title,
											alt_text: block.attributes.alt,
											caption: block.attributes.caption,
										},
										onFileChange: ( [ media ] ) => {
											if ( media.id ) {
												resolve( media );
											}
										},
										allowedTypes,
										onError: reject,
									} )
								)
								.catch( () => resolve( block.attributes.url ) );
					  } )
			)
		).catch( ( err ) => onError( err ) );

		if ( multiple ) {
			onSelect( uploadedMediaList );
		} else {
			onSelect( uploadedMediaList[ 0 ] );
		}
	}

	async function onHTMLDrop( HTML ) {
		const blocks = pasteHandler( { HTML } );
		return await handleBlocksDrop( blocks );
	}

	const onUpload = ( event ) => {
		onFilesUpload( event.target.files );
	};

	const defaultRenderPlaceholder = ( content ) => {
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
				onDoubleClick={ onDoubleClick }
				preview={ mediaPreview }
				style={ style }
			>
				{ content }
				{ children }
			</Placeholder>
		);
	};
	const renderPlaceholder = placeholder ?? defaultRenderPlaceholder;

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
					variant="link"
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
				<URLSelectionUI
					isURLInputVisible={ isURLInputVisible }
					src={ src }
					onChangeSrc={ onChangeSrc }
					onSubmitSrc={ onSubmitSrc }
					openURLInput={ openURLInput }
					closeURLInput={ closeURLInput }
				/>
			)
		);
	};

	const renderFeaturedImageToggle = () => {
		return (
			onToggleFeaturedImage && (
				<div className="block-editor-media-placeholder__url-input-container">
					<Button
						className="block-editor-media-placeholder__button"
						onClick={ onToggleFeaturedImage }
						variant="tertiary"
					>
						{ __( 'Use featured image' ) }
					</Button>
				</div>
			)
		);
	};

	const renderMediaUploadChecked = () => {
		const defaultButton = ( { open } ) => {
			return (
				<Button
					variant="tertiary"
					onClick={ () => {
						open();
					} }
				>
					{ __( 'Media Library' ) }
				</Button>
			);
		};
		const libraryButton = mediaLibraryButton ?? defaultButton;
		const uploadMediaLibraryButton = (
			<MediaUpload
				addToGallery={ addToGallery }
				gallery={ multiple && onlyAllowsImages() }
				multiple={ multiple }
				onSelect={ onSelect }
				allowedTypes={ allowedTypes }
				mode={ 'browse' }
				value={
					Array.isArray( value )
						? value.map( ( { id } ) => id )
						: value.id
				}
				render={ libraryButton }
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
										variant="primary"
										className={ classnames(
											'block-editor-media-placeholder__button',
											'block-editor-media-placeholder__upload-button'
										) }
										onClick={ openFileDialog }
									>
										{ __( 'Upload' ) }
									</Button>
									{ uploadMediaLibraryButton }
									{ renderUrlSelectionUI() }
									{ renderFeaturedImageToggle() }
									{ renderCancelLink() }
								</>
							);
							return renderPlaceholder( content );
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
						variant="primary"
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
					{ uploadMediaLibraryButton }
					{ renderUrlSelectionUI() }
					{ renderFeaturedImageToggle() }
					{ renderCancelLink() }
				</>
			);
			return renderPlaceholder( content );
		}

		return renderPlaceholder( uploadMediaLibraryButton );
	};

	if ( disableMediaButtons ) {
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
