/**
 * WordPress dependencies
 */
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

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import LinkControl from '../link-control';
import { store as blockEditorStore } from '../../store';

const noop = () => {};
let uniqueId = 0;

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
	popoverProps,
	renderToggle,
} ) => {
	const { getSettings } = useSelect( blockEditorStore );
	const errorNoticeID = `block-editor/media-replace-flow/error-notice/${ ++uniqueId }`;

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
		getSettings().mediaUpload( {
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

	return (
		<Dropdown
			popoverProps={ popoverProps }
			contentClassName="block-editor-media-replace-flow__options"
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
								accept={ accept }
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
						{ typeof children === 'function'
							? children( { onClose } )
							: children }
					</NavigableMenu>
					{ onSelectURL && (
						// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
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
