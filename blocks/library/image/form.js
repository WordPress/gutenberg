/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { Placeholder } from 'components';

/**
 * Internal dependencies
 */
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import InspectorControls from '../../inspector-controls';
import TextControl from '../../inspector-controls/text-control';

class ImageBlockForm extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.onUpdateAlt = this.onUpdateAlt.bind( this );
		this.onSelectImage = this.onSelectImage.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.onCloseMediaModal = this.onCloseMediaModal.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	onSelectImage( media ) {
		this.props.setAttributes( { url: media.url } );
	}

	onCloseMediaModal() {
		// Can't find why the setTimeout is needed
		// Probably a focus call conflict
		setTimeout( () => {
			if ( this.container ) {
				this.container.focus();
			}
		} );
	}

	onUpdateAlt( newAlt ) {
		this.props.setAttributes( { alt: newAlt } );
	}

	onFocusCaption( focusValue ) {
		this.props.setFocus( { editable: 'caption', ...focusValue } );
	}

	render() {
		const { attributes, setAttributes, focus, setFocus } = this.props;
		const { url, alt, caption } = attributes;
		const uploadButtonProps = { isLarge: true };

		// Disable reason: Each block can be selected by clicking on it

		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<div ref={ this.bindContainer } tabIndex="-1">
				{ focus && (
					<InspectorControls>
						<TextControl label={ __( 'Alternate Text' ) } value={ alt } onChange={ this.onUpdateAlt } />
					</InspectorControls>
				) }
				{ ! url && (
					<Placeholder
						key="placeholder"
						instructions={ __( 'Drag image here or insert from media library' ) }
						icon="format-image"
						label={ __( 'Image' ) }
						className="blocks-image">
						<MediaUploadButton
							buttonProps={ uploadButtonProps }
							onSelect={ this.onSelectImage }
							onClose={ this.onCloseMediaModal }
							type="image"
							autoOpen
						>
							{ __( 'Insert from Media Library' ) }
						</MediaUploadButton>
					</Placeholder>
				) }
				{ url && (
					<figure className="blocks-image">
						<img src={ url } alt={ alt } onClick={ setFocus } />
						{ ( caption && caption.length > 0 ) || !! focus ? (
							<Editable
								tagName="figcaption"
								placeholder={ __( 'Write caption…' ) }
								value={ caption }
								focus={ focus && focus.editable === 'caption' ? focus : undefined }
								onFocus={ this.onFocusCaption }
								onChange={ ( value ) => setAttributes( { caption: value } ) }
								inline
								inlineToolbar
							/>
						) : null }
					</figure>
				) }
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default ImageBlockForm;
