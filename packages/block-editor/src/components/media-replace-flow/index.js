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
	Toolbar,
	Button,
	Popover,
	withNotices,
} from '@wordpress/components';
import {
	LEFT,
	RIGHT,
	UP,
	DOWN,
	BACKSPACE,
	ENTER,
} from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import LinkEditor from '../url-popover/link-editor';
import LinkViewer from '../url-popover/link-viewer';

const MediaReplaceFlow = (
	{
		mediaURL,
		allowedTypes,
		accept,
		onSelect,
		onSelectURL,
		onError,
		name = __( 'Replace' ),
	}
) => {
	const [ showURLInput, setShowURLInput ] = useState( false );
	const [ showEditURLInput, setShowEditURLInput ] = useState( false );
	const [ mediaURLValue, setMediaURLValue ] = useState( mediaURL );
	const [ showMediaReplaceOptions, setShowMediaReplaceOptions ] = useState( false );
	const mediaUpload = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings().mediaUpload;
	}, [] );
	const editMediaButtonRef = createRef();

	const stopPropagation = ( event ) => {
		event.stopPropagation();
	};

	const stopPropagationRelevantKeys = ( event ) => {
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
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

	const uploadFiles = ( event ) => {
		const files = event.target.files;
		const setMedia = ( [ media ] ) => {
			setShowMediaReplaceOptions( false );
			selectMedia( media );
		};
		mediaUpload( {
			allowedTypes,
			filesList: files,
			onFileChange: setMedia,
			onError,
		} );
	};

	const onClose = () => {
		editMediaButtonRef.current.focus();
	};

	const onClickOutside = () => ( setShowMediaReplaceOptions( false ) );

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
				onChangeInputValue={ ( url ) => ( setMediaURLValue( url ) ) }
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
				className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
				url={ mediaURLValue }
				onEditLinkClick={ () => ( setShowEditURLInput( ! showEditURLInput ) ) }
			/>
		);
	}

	return (
		<MediaUpload
			onSelect={ ( media ) => selectMedia( media ) }
			onClose={ () => setShowMediaReplaceOptions( true ) }
			allowedTypes={ allowedTypes }
			render={ ( { open } ) => (
				<Toolbar className={ 'media-replace-flow components-dropdown-menu' }>
					<Button
						ref={ editMediaButtonRef }
						className={ 'components-icon-button components-dropdown-menu__toggle' }
						onClick={ () => {
							setShowMediaReplaceOptions( ! showMediaReplaceOptions );
						} }
						onKeyDown={ openOnArrowDown }
					>
						<span className="components-dropdown-menu__label" > { name } </span>
						<span className="components-dropdown-menu__indicator" />
					</Button>
					{ showMediaReplaceOptions &&
						<Popover
							onClickOutside={ onClickOutside }
							onClose={ onClose }
							className={ 'media-replace-flow__options' }
						>
							<NavigableMenu>
								<MenuItem
									icon="admin-media"
									onClick={ open }
								>
									{ __( 'Open Media Library' ) }
								</MenuItem>
								<MediaUploadCheck>
									<FormFileUpload
										onChange={ uploadFiles }
										accept={ accept }
										render={ ( { openFileDialog } ) => {
											return (
												<MenuItem
													icon="upload"
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
								<MenuItem
									icon="admin-links"
									onClick={ () => ( setShowURLInput( ! showURLInput ) ) }
									aria-expanded={ showURLInput }
								>
									<div> { __( 'Insert from URL' ) } </div>
								</MenuItem>
							</NavigableMenu>
							{ showURLInput && <div className="block-editor-media-flow__url-input">
								{ urlInputUIContent }
							</div> }
						</Popover>
					}
				</Toolbar>
			) }
		/>
	);
};

export default compose(
	withNotices,
)( MediaReplaceFlow );
