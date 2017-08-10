/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { pick } from 'lodash';

/*
 * The media library image object contains numerous attributes
 * we only need this set to display the image in the library.
 */
const slimImageObject = ( img ) => {
	const attrSet = [ 'sizes', 'mime', 'type', 'subtype', 'id', 'url', 'alt', 'link' ];
	return pick( img, attrSet );
};

class MediaUploadButton extends Component {
	constructor( { multiple = false, type, frame = false } ) {
		super( ...arguments );
		this.openModal = this.openModal.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onUpdate = this.onUpdate.bind( this );
		this.onOpen = this.onOpen.bind( this );
		const frameConfig = {
			title: __( 'Select or Upload a media' ),
			button: {
				text: __( 'Select' ),
			},
			multiple,
			selection: new wp.media.model.Selection( [] ),
		};
		if ( !! type ) {
			frameConfig.library = { type };
		}

		// Use a frame workflow passed to the button if it exists.
		if ( frame ) {
			this.frame = new frame();
			wp.media.frame = this.frame;
		} else {
			this.frame = wp.media( frameConfig );
		}

		// When an image is selected in the media frame...
		this.frame.on( 'select', this.onSelect );
		this.frame.on( 'update', this.onUpdate );
		this.frame.on( 'open', this.onOpen );
	}

	componentWillUnmount() {
		this.frame.remove();
	}

	onUpdate( selections ) {
		const { onSelect, multiple = false } = this.props;
		const state = this.frame.state();
		const selectedImages = selections || state.get( 'selection' );

		if ( ! selectedImages || ! selectedImages.models.length ) {
			return;
		}
		if ( multiple ) {
			onSelect( selectedImages.models.map( ( model ) => slimImageObject( model.toJSON() ) ) );
		} else {
			onSelect( slimImageObject( selectedImages.models[ 0 ].toJSON() ) );
		}
	}

	onSelect() {
		const { onSelect, multiple = false } = this.props;
		// Get media attachment details from the frame state
		const attachment = this.frame.state().get( 'selection' ).toJSON();
		onSelect( multiple ? attachment : attachment[ 0 ] );
	}

	onOpen() {
		const selection = this.frame.state().get( 'selection' );
		const addMedia = ( id ) => {
			const attachment = wp.media.attachment( id );
			attachment.fetch();
			selection.add( attachment );
		};

		if ( ! this.props.value ) {
			return;
		}

		if ( this.props.multiple ) {
			this.props.value.map( addMedia );
		} else {
			addMedia( this.props.value );
		}
	}

	openModal() {
		this.frame.open();
	}

	render() {
		const { children, buttonProps } = this.props;

		return (
			<Button onClick={ this.openModal } { ...buttonProps }>
				{ children }
			</Button>
		);
	}
}

export default MediaUploadButton;
