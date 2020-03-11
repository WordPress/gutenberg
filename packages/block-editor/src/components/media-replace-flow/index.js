/**
 * WordPress dependencies
 */
import { useState, createRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import {
	FormFileUpload,
	NavigableMenu,
	MenuItem,
	ToolbarGroup,
	Button,
	Dropdown,
	withNotices,
} from '@wordpress/components';
import { DOWN } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { upload, media as mediaIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import LinkControl from '../link-control';

const MediaReplaceFlow = ( {
	mediaURL,
	mediaId,
	allowedTypes,
	accept,
	onSelect,
	onSelectURL,
	onError,
	name = __( 'Replace' ),
} ) => {
	const [ mediaURLValue, setMediaURLValue ] = useState( mediaURL );
	const mediaUpload = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings().mediaUpload;
	}, [] );
	const editMediaButtonRef = createRef();

	const selectMedia = ( media ) => {
		onSelect( media );
		setMediaURLValue( media.url );
		speak( __( 'The media file has been replaced' ) );
	};

	const selectURL = ( newURL ) => {
		onSelectURL( newURL );
	};

	const uploadFiles = ( event, closeDropdown ) => {
		const files = event.target.files;
		const setMedia = ( [ media ] ) => {
			selectMedia( media );
			closeDropdown();
		};
		mediaUpload( {
			allowedTypes,
			filesList: files,
			onFileChange: setMedia,
			onError,
		} );
	};

	const openOnArrowDown = ( event ) => {
		if ( event.keyCode === DOWN ) {
			event.preventDefault();
			event.stopPropagation();
			event.target.click();
		}
	};

	return (
		<Dropdown
			contentClassName="block-editor-media-replace-flow__options"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarGroup className="media-replace-flow">
					<Button
						ref={ editMediaButtonRef }
						aria-expanded={ isOpen }
						onClick={ onToggle }
						onKeyDown={ openOnArrowDown }
					>
						{ name }
					</Button>
				</ToolbarGroup>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<NavigableMenu>
						<MediaUpload
							value={ mediaId }
							onSelect={ ( media ) => selectMedia( media ) }
							allowedTypes={ allowedTypes }
							render={ ( { open } ) => (
								<MenuItem icon={ mediaIcon } onClick={ open }>
									{ __( 'Open Media Library' ) }
								</MenuItem>
							) }
						/>
						<MediaUploadCheck>
							<FormFileUpload
								onChange={ ( event ) => {
									uploadFiles( event, onClose );
								} }
								accept={ accept }
								render={ ( { openFileDialog } ) => {
									return (
										<MenuItem
											icon={ upload }
											onClick={ () => {
												openFileDialog();
											} }
										>
											{ __( 'Upload' ) }
										</MenuItem>
									);
								} }
							/>
						</MediaUploadCheck>
					</NavigableMenu>
					{ onSelectURL && (
						// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
						<form
							className="block-editor-media-flow__url-input"
							onKeyDown={ ( event ) => {
								event.stopPropagation();
							} }
							onKeyPress={ ( event ) => {
								event.stopPropagation();
							} }
						>
							<span className="block-editor-media-replace-flow__image-url-label">
								{ __( 'Current media URL:' ) }
							</span>
							<LinkControl
								value={ { url: mediaURLValue } }
								settings={ [] }
								showSuggestions={ false }
								onChange={ ( { url } ) => {
									setMediaURLValue( url );
									selectURL( url );
									editMediaButtonRef.current.focus();
								} }
							/>
						</form>
					) }
				</>
			) }
		/>
	);
};

export default compose( withNotices )( MediaReplaceFlow );
