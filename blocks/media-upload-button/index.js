/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { __ } from 'i18n';
import { Button } from 'components';

class MediaUploadButton extends Component {
	constructor( { multiple = false, type } ) {
		super( ...arguments );
		this.openModal = this.openModal.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onOpen = this.onOpen.bind( this );
		const frameConfig = {
			title: __( 'Select or Upload a media' ),
			button: {
				text: __( 'Select' ),
			},
			multiple,
		};
		if ( !! type ) {
			frameConfig.library = { type };
		}
		this.frame = wp.media( frameConfig );

		// When an image is selected in the media frame...
		this.frame.on( 'select', this.onSelect );
		this.frame.on( 'open', this.onOpen );
	}

	componentWillUnmount() {
		this.frame.remove();
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
