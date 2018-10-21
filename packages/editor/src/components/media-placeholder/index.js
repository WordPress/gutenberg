/**
 * External dependencies
 */
import { every, get, noop, startsWith, difference, isEmpty } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	FormFileUpload,
	Placeholder,
	DropZone,
	IconButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import URLPopover from '../url-popover';
import { mediaUpload } from '../../utils/';

const InsertFromURLPopover = ( { src, onChange, onSubmit, onClose } ) => (
	<URLPopover onClose={ onClose }>
		<form
			className="editor-media-placeholder__url-input-form"
			onSubmit={ onSubmit }
		>
			<input
				className="editor-media-placeholder__url-input-field"
				type="url"
				aria-label={ __( 'URL' ) }
				placeholder={ __( 'Paste or type URL' ) }
				onChange={ onChange }
				value={ src }
			/>
			<IconButton
				className="editor-media-placeholder__url-input-submit-button"
				icon="editor-break"
				label={ __( 'Apply' ) }
				type="submit"
			/>
		</form>
	</URLPopover>
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
			src,
		} = this.state;

		const allowedTypes = this.getAllowedTypes();

		let instructions = labels.instructions || '';
		if ( ! instructions ) {
			instructions = __( 'Drag a media file, upload a new one or select a file from your library.' );

			if ( isEmpty( difference( allowedTypes, [ 'video' ] ) ) ) {
				instructions = __( 'Drag a video, upload a new one or select a file from your library.' );
			} else if ( isEmpty( difference( allowedTypes, [ 'image' ] ) ) ) {
				instructions = __( 'Drag an image, upload a new one or select a file from your library.' );
			} else if ( isEmpty( difference( allowedTypes, [ 'audio' ] ) ) ) {
				instructions = __( 'Drag an audio, upload a new one or select a file from your library.' );
			} else if ( isEmpty( difference( allowedTypes, [ 'image', 'video' ] ) ) ) {
				instructions = __( 'Drag an image or a video, upload a new one or select a file from your library.' );
			}
		}

		return (
			<Placeholder
				icon={ icon }
				label={ labels.title }
				instructions={ instructions }
				className={ classnames( 'editor-media-placeholder', className ) }
				notices={ notices }
			>
				<DropZone
					onFilesDrop={ this.onFilesUpload }
					onHTMLDrop={ onHTMLDrop }
				/>
				<FormFileUpload
					isLarge
					className="editor-media-placeholder__button"
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
						<Button
							isLarge
							className="editor-media-placeholder__button"
							onClick={ open }
						>
							{ __( 'Media Library' ) }
						</Button>
					) }
				/>
				{ onSelectURL && (
					<div className="editor-media-placeholder__url-input-container">
						<Button
							className="editor-media-placeholder__button"
							onClick={ this.openURLInput }
							isToggled={ isURLInputVisible }
							isLarge
						>
							{ __( 'Insert from URL' ) }
						</Button>
						{ isURLInputVisible && (
							<InsertFromURLPopover
								src={ src }
								onChange={ this.onChangeSrc }
								onSubmit={ this.onSubmitSrc }
								onClose={ this.closeURLInput }
							/>
						) }
					</div>
				) }
			</Placeholder>
		);
	}
}

export default MediaPlaceholder;
