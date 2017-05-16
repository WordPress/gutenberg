/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { __ } from 'i18n';
import Button from 'components/button';

class MediaUploadButton extends Component {
	constructor( { multiple = false } ) {
		super( ...arguments );
		this.openModal = this.openModal.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.frame = wp.media( {
			title: __( 'Select or Upload a media' ),
			button: {
				text: __( 'Select' ),
			},
			multiple,
		} );

		// When an image is selected in the media frame...
		this.frame.on( 'select', this.onSelect );
	}

	onSelect() {
		const { onSelect, multiple = false } = this.props;
		// Get media attachment details from the frame state
		const attachment = this.frame.state().get( 'selection' ).toJSON();
		onSelect( multiple ? attachment : attachment[ 0 ] );
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
