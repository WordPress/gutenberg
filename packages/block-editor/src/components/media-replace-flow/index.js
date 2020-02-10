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
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { link, upload } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import LinkEditor from '../url-popover/link-editor';
import LinkViewer from '../url-popover/link-viewer';

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
	const [ showURLInput, setShowURLInput ] = useState( false );
	const [ showEditURLInput, setShowEditURLInput ] = useState( false );
	const [ mediaURLValue, setMediaURLValue ] = useState( mediaURL );
	const mediaUpload = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings().mediaUpload;
	}, [] );
	const editMediaButtonRef = createRef();

	const stopPropagation = ( event ) => {
		event.stopPropagation();
	};

	const stopPropagationRelevantKeys = ( event ) => {
		if (
			[ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf(
				event.keyCode
			) > -1
		) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	};

	const selectMedia = ( media ) => {
		onSelect( media );
		setMediaURLValue( media.url );
		speak( __( 'The media file has been replaced' ) );
	};

	const selectURL = ( newURL ) => {
		onSelectURL( newURL );
		setShowEditURLInput( false );
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

	let urlInputUIContent;
	if ( showEditURLInput ) {
		urlInputUIContent = (
			<LinkEditor
				onKeyDown={ stopPropagationRelevantKeys }
				onKeyPress={ stopPropagation }
				value={ mediaURLValue }
				isFullWidthInput={ true }
				hasInputBorder={ true }
				onChangeInputValue={ ( url ) => setMediaURLValue( url ) }
				onSubmit={ ( event ) => {
					event.preventDefault();
					selectURL( mediaURLValue );
					editMediaButtonRef.current.focus();
				} }
			/>
		);
	} else {
		urlInputUIContent = (
			<LinkViewer
				isFullWidth={ true }
				className="block-editor-media-replace-flow__link-viewer"
				url={ mediaURLValue }
				onEditLinkClick={ () =>
					setShowEditURLInput( ! showEditURLInput )
				}
			/>
		);
	}

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
						<span className="block-editor-media-replace-flow__indicator" />
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
								<MenuItem icon="admin-media" onClick={ open }>
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
						{ onSelectURL && (
							<MenuItem
								icon={ link }
								onClick={ () =>
									setShowURLInput( ! showURLInput )
								}
								aria-expanded={ showURLInput }
							>
								<div> { __( 'Insert from URL' ) } </div>
							</MenuItem>
						) }
					</NavigableMenu>
					{ showURLInput && (
						<div className="block-editor-media-flow__url-input">
							{ urlInputUIContent }
						</div>
					) }
				</>
			) }
		/>
	);
};

export default compose( withNotices )( MediaReplaceFlow );
