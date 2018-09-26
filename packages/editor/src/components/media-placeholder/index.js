/**
 * External dependencies
 */
import { every, get, noop, startsWith } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	FormFileUpload,
	Placeholder,
	DropZone,
	Popover,
	IconButton,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import { mediaUpload } from '../../utils/';

const stopPropagation = ( event ) => event.stopPropagation();

const UrlInputPopover = ( { value, onChange, onSubmit, onClickOutside } ) => (
	<Popover
		position="bottom center"
		onClickOutside={ onClickOutside }
	>
		{ // Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
		/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */ }
		<form
			className="editor-format-toolbar__link-modal"
			onKeyPress={ stopPropagation }

			onSubmit={ onSubmit }
		>
			<div className="editor-format-toolbar__link-modal-line">
				<div className="editor-url-input">
					<input
						type="text"
						aria-label={ __( 'URL' ) }
						placeholder={ __( 'Paste URL or type' ) }
						onChange={ onChange }
						value={ value }
					/>
				</div>
				<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
			</div>
		</form>
		{ /* eslint-enable jsx-a11y/no-noninteractive-element-interactions */ }
	</Popover>
);

class MediaPlaceholder extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			src: '',
			isURLInputVisible: false,
		};
		this.onChangeSrc = this.onChangeSrc.bind( this );
		this.onSubmitSrc = this.onSubmitSrc.bind( this );
		this.onUpload = this.onUpload.bind( this );
		this.onFilesUpload = this.onFilesUpload.bind( this );
		this.openURLInput = this.openURLInput.bind( this );
		this.closeURLInput = this.closeURLInput.bind( this );
	}

	getAllowedTypes() {
		const { allowedTypes, type: deprecatedType } = this.props;
		let allowedTypesToUse = allowedTypes;
		if ( ! allowedTypes && deprecatedType ) {
			deprecated( 'type property of wp.editor.MediaPlaceholder', {
				version: '4.2',
				alternative: 'allowedTypes property containing an array with the allowedTypes or do not pass any property if all types are allowed',
			} );
			if ( deprecatedType === '*' ) {
				allowedTypesToUse = undefined;
			} else {
				allowedTypesToUse = [ deprecatedType ];
			}
		}
		return allowedTypesToUse;
	}

	onlyAllowsImages() {
		const allowedTypes = this.getAllowedTypes();
		if ( ! allowedTypes ) {
			return false;
		}
		return every( allowedTypes, ( allowedType ) => {
			return allowedType === 'image' || startsWith( allowedType, 'image/' );
		} );
	}

	componentDidMount() {
		this.setState( { src: get( this.props.value, [ 'src' ], '' ) } );
	}

	componentDidUpdate( prevProps ) {
		if ( get( prevProps.value, [ 'src' ], '' ) !== get( this.props.value, [ 'src' ], '' ) ) {
			this.setState( { src: get( this.props.value, [ 'src' ], '' ) } );
		}
	}

	onChangeSrc( event ) {
		this.setState( { src: event.target.value } );
	}

	onSubmitSrc( event ) {
		event.preventDefault();
		if ( this.state.src && this.props.onSelectURL ) {
			this.props.onSelectURL( this.state.src );
			this.closeURLInput();
		}
	}

	onUpload( event ) {
		this.onFilesUpload( event.target.files );
	}

	onFilesUpload( files ) {
		const { onSelect, multiple, onError } = this.props;
		const allowedTypes = this.getAllowedTypes();
		const setMedia = multiple ? onSelect : ( [ media ] ) => onSelect( media );
		mediaUpload( {
			allowedTypes,
			filesList: files,
			onFileChange: setMedia,
			onError,
		} );
	}

	openURLInput() {
		this.setState( { isURLInputVisible: true } );
	}

	closeURLInput() {
		this.setState( { isURLInputVisible: false } );
	}

	render() {
		const {
			accept,
			icon,
			className,
			labels,
			onSelect,
			value = {},
			onSelectURL,
			onHTMLDrop = noop,
			multiple = false,
			notices,
		} = this.props;

		const {
			isURLInputVisible,
		} = this.state;

		const toggleURLInput = ! isURLInputVisible ? this.openURLInput : undefined;

		const allowedTypes = this.getAllowedTypes();

		return (
			<Placeholder
				icon={ icon }
				label={ labels.title }
				// translators: %s: media name label e.g: "an audio","an image", "a video"
				instructions={ sprintf( __( 'Drag %s, upload a new one or select a file from your library.' ), labels.name ) }
				className={ classnames( 'editor-media-placeholder', className ) }
				notices={ notices }
			>
				<DropZone
					onFilesDrop={ this.onFilesUpload }
					onHTMLDrop={ onHTMLDrop }
				/>
				<FormFileUpload
					isLarge
					className="editor-media-placeholder__upload-button"
					onChange={ this.onUpload }
					accept={ accept }
					multiple={ multiple }
				>
					{ __( 'Upload' ) }
				</FormFileUpload>
				<MediaUpload
					gallery={ multiple && this.onlyAllowsImages() }
					multiple={ multiple }
					onSelect={ onSelect }
					allowedTypes={ allowedTypes }
					value={ value.id }
					render={ ( { open } ) => (
						<Button isLarge onClick={ open }>
							{ __( 'Media Library' ) }
						</Button>
					) }
				/>
				{ onSelectURL && (
					<div
						className="editor-media-placeholder__url-input-container"
					>
						<Button
							className="editor-media-placeholder__url-input-toggle-button"
							onClick={ toggleURLInput }
							isToggled={ isURLInputVisible }
							isLarge>
							{ __( 'Insert from URL' ) }
						</Button>
						{ isURLInputVisible && (
							<UrlInputPopover
								onChange={ this.onChangeSrc }
								value={ this.state.src }
								onSubmit={ this.onSubmitSrc }
								onClickOutside={ this.closeURLInput }
							/>
						) }
					</div>
				) }
			</Placeholder>
		);
	}
}

export default MediaPlaceholder;
