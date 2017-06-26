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
	}

	componentDidMount() {
		if ( !! this.props.autoOpen ) {
			setTimeout( () => this.frame.open() );
		}
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
