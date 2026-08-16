import clsx from 'clsx';
import { __, _x } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import {
	FormFileUpload,
	NavigableMenu,
	MenuItem,
	Dropdown,
	withFilters,
	ToolbarButton,
} from '@wordpress/components';
import { useSelect, withDispatch } from '@wordpress/data';
import { DOWN } from '@wordpress/keycodes';
import {
	postFeaturedImage,
	upload,
	media as mediaIcon,
} from '@wordpress/icons';
import { compose } from '@wordpress/compose';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo } from '@wordpress/element';
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import LinkControl from '../link-control';
import { store as blockEditorStore } from '../../store';
import { getComputedAcceptAttribute } from '../media-placeholder/utils';

const noop = () => {};
let uniqueId = 0;

/**
 * A component that implements a replacement flow for various media objects.
 *
 * @example
 * ```jsx
 * function Example() {
 *   const [ mediaURL, setMediaURL ] = useState( 'https://example.media' );
 *
 *   return (
 *     <BlockControls>
 *       <MediaReplaceFlow
 *         allowedTypes={ [ 'png' ] }
 *         accept="image/*"
 *         mediaURL={ mediaURL }
 *         onSelectURL={ setMediaURL }
 *       />
 *     </BlockControls>
 *   );
 * }
 * ```
 *
 * @param {Object}   props                       The component props.
 * @param {string}   props.mediaURL              The URL of the media.
 * @param {number}   props.mediaId               The Id of the attachment post type for the current media.
 * @param {Array}    props.mediaIds              The Ids of the attachments post type for the current media.
 * @param {Array}    props.allowedTypes          A list of media types allowed to replace the current media.
 * @param {string}   props.accept                The mime type of the media.
 * @param {Function} props.onError               Callback called when an upload error happens and receives an error message as an argument.
 * @param {Function} props.onSelect              Callback used when media is replaced from the Media Library or when a new media is uploaded. It is called with one argument `media` which is an object with all the media details.
 * @param {Function} props.onSelectURL           Callback used when media URL is selected.
 * @param {Function} props.onReset               Callback used when the media should be reset.
 * @param {Function} props.onToggleFeaturedImage Callback used when the featured image should be toggled.
 * @param {boolean}  props.useFeaturedImage      Whether the featured image is currently used.
 * @param {Function} props.onFilesUpload         Callback called before to start to upload the files. It receives an array with the files to upload before to the final process.
 * @param {string}   props.name                  A `string` value will be used as the label of the replace button. It can also accept `Phrasing content` elements(ex. `span`).
 * @param {Function} props.createNotice          Creates a media replace notice.
 * @param {Function} props.removeNotice          Removes a media replace notice.
 * @param {Element}  props.children              If passed, children are rendered inside the dropdown.
 * @param {boolean}  props.multiple              If multiple is true, the user can select multiple images from the media library.
 * @param {boolean}  props.addToGallery          If true, the user can add the selected images to the gallery.
 * @param {boolean}  props.handleUpload          Whether the component should handle the upload process.
 * @param {Object}   props.popoverProps          The props to be passed to the `Popover` component.
 *
 * @return {Element} The component to be rendered.
 */
const MediaReplaceFlow = ( {
	mediaURL,
	mediaId,
	mediaIds,
	allowedTypes,
	accept,
	onError,
	onSelect,
	onSelectURL,
	onReset,
	onToggleFeaturedImage,
	useFeaturedImage,
	onFilesUpload = noop,
	name = __( 'Replace' ),
	createNotice,
	removeNotice,
	children,
	multiple = false,
	addToGallery,
	handleUpload = true,
	variant,
	popoverProps,
	renderToggle,
	className,
} ) => {
	const { mediaUpload, allowedMimeTypes } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			mediaUpload: settings.mediaUpload,
			allowedMimeTypes: settings.allowedMimeTypes,
		};
	}, [] );
	const errorNoticeID = `block-editor/media-replace-flow/error-notice/${ ++uniqueId }`;

	const computedAccept = useMemo(
		() =>
			getComputedAcceptAttribute(
				allowedTypes,
				allowedMimeTypes,
				accept
			),
		[ allowedTypes, allowedMimeTypes, accept ]
	);

	const onUploadError = ( message ) => {
		const safeMessage = stripHTML( message );
		if ( onError ) {
			onError( safeMessage );
			return;
		}
		// We need to set a timeout for showing the notice
		// so that VoiceOver and possibly other screen readers
		// can announce the error after the toolbar button
		// regains focus once the upload dialog closes.
		// Otherwise VO simply skips over the notice and announces
		// the focused element and the open menu.
		setTimeout( () => {
			createNotice( 'error', safeMessage, {
				speak: true,
				id: errorNoticeID,
				isDismissible: true,
			} );
		}, 1000 );
	};

	const selectMedia = ( media, closeMenu ) => {
		if ( useFeaturedImage && onToggleFeaturedImage ) {
			onToggleFeaturedImage();
		}
		closeMenu();
		// Calling `onSelect` after the state update since it might unmount the component.
		onSelect( media );
		speak( __( 'The media file has been replaced' ) );
		removeNotice( errorNoticeID );
	};

	const uploadFiles = ( event, closeMenu ) => {
		const files = event.target.files;
		if ( ! handleUpload ) {
			closeMenu();
			return onSelect( files );
		}
		onFilesUpload( files );
		mediaUpload( {
			allowedTypes,
			filesList: files,
			onFileChange: ( [ media ] ) => {
				selectMedia( media, closeMenu );
			},
			onError: onUploadError,
		} );
	};

	const openOnArrowDown = ( event ) => {
		if ( event.keyCode === DOWN ) {
			event.preventDefault();
			event.target.click();
		}
	};

	const onlyAllowsImages = () => {
		if ( ! allowedTypes || allowedTypes.length === 0 ) {
			return false;
		}

		return allowedTypes.every(
			( allowedType ) =>
				allowedType === 'image' || allowedType.startsWith( 'image/' )
		);
	};

	const gallery = multiple && onlyAllowsImages();

	const mergedPopoverProps = {
		...popoverProps,
		variant,
	};

	return (
		<Dropdown
			popoverProps={ mergedPopoverProps }
			className={ className }
			contentClassName={ clsx(
				'block-editor-media-replace-flow__options',
				variant && `is-variant-${ variant }`
			) }
			renderToggle={ ( { isOpen, onToggle } ) => {
				if ( renderToggle ) {
					return renderToggle( {
						'aria-expanded': isOpen,
						'aria-haspopup': 'true',
						onClick: onToggle,
						onKeyDown: openOnArrowDown,
						children: name,
					} );
				}
				return (
					<ToolbarButton
						aria-expanded={ isOpen }
						aria-haspopup="true"
						onClick={ onToggle }
						onKeyDown={ openOnArrowDown }
					>
						{ name }
					</ToolbarButton>
				);
			} }
			renderContent={ ( { onClose } ) => (
				<>
					<NavigableMenu className="block-editor-media-replace-flow__media-upload-menu">
						<MediaUploadCheck>
							<MediaUpload
								gallery={ gallery }
								addToGallery={ addToGallery }
								multiple={ multiple }
								value={ multiple ? mediaIds : mediaId }
								onSelect={ ( media ) =>
									selectMedia( media, onClose )
								}
								allowedTypes={ allowedTypes }
								render={ ( { open } ) => (
									<MenuItem
										icon={ mediaIcon }
										onClick={ open }
									>
										{ __( 'Open Media Library' ) }
									</MenuItem>
								) }
							/>
							<FormFileUpload
								onChange={ ( event ) => {
									uploadFiles( event, onClose );
								} }
								accept={ computedAccept }
								multiple={ !! multiple }
								render={ ( { openFileDialog } ) => {
									return (
										<MenuItem
											icon={ upload }
											onClick={ () => {
												openFileDialog();
											} }
										>
											{ _x( 'Upload', 'verb' ) }
										</MenuItem>
									);
								} }
							/>
						</MediaUploadCheck>
						{ onToggleFeaturedImage && (
							<MenuItem
								icon={ postFeaturedImage }
								onClick={ onToggleFeaturedImage }
								isPressed={ useFeaturedImage }
							>
								{ __( 'Use featured image' ) }
							</MenuItem>
						) }
						{ typeof children === 'function'
							? children( { onClose } )
							: children }
						{ mediaURL && onReset && (
							<MenuItem
								onClick={ () => {
									onReset();
									onClose();
								} }
							>
								{ __( 'Reset' ) }
							</MenuItem>
						) }
					</NavigableMenu>
					{ onSelectURL && (
						<form className="block-editor-media-flow__url-input">
							<span className="block-editor-media-replace-flow__image-url-label">
								{ __( 'Current media URL:' ) }
							</span>

							<LinkControl
								value={ { url: mediaURL } }
								settings={ [] }
								showSuggestions={ false }
								onChange={ ( { url } ) => {
									onSelectURL( url );
								} }
								searchInputPlaceholder={ __(
									'Paste or type URL'
								) }
							/>
						</form>
					) }
				</>
			) }
		/>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/media-replace-flow/README.md
 */
export default compose( [
	withDispatch( ( dispatch ) => {
		const { createNotice, removeNotice } = dispatch( noticesStore );
		return {
			createNotice,
			removeNotice,
		};
	} ),
	withFilters( 'editor.MediaReplaceFlow' ),
] )( MediaReplaceFlow );
