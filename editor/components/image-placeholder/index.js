/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import MediaPlaceholder from '../media-placeholder';

/**
 *  ImagePlaceholder is a react component used by blocks containing user configurable images e.g: image and cover image.
 */
class ImagePlaceholder extends Component {
	componentDidMount() {
		deprecated( 'wp.editor.ImagePlaceholder', {
			version: '3.2',
			alternative: 'wp.editor.MediaPlaceholder',
			plugin: 'Gutenberg',
		} );
	}

	render() {
		const { label, onSelectImage, multiple = false, ...props } = this.props;
		return (
			<MediaPlaceholder
				labels={ {
					title: label,
					name: multiple ? __( 'images' ) : __( 'an image' ),
				} }
				onSelect={ onSelectImage }
				accept="image/*"
				type="image"
				multiple={ multiple }
				{ ...props }
			/>
		);
	}
}

export default ImagePlaceholder;
