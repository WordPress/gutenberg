/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Picker } from '@wordpress/components';

const IMAGE_SIZE_THUMBNAIL = 'thumbnail';
const IMAGE_SIZE_MEDIUM = 'medium';
const IMAGE_SIZE_LARGE = 'large';
const IMAGE_SIZE_FULL_SIZE = 'full';
const DEFAULT_SIZE_SLUG = IMAGE_SIZE_LARGE;
const sizeOptionLabels = {
	[ IMAGE_SIZE_THUMBNAIL ]: __( 'Thumbnail' ),
	[ IMAGE_SIZE_MEDIUM ]: __( 'Medium' ),
	[ IMAGE_SIZE_LARGE ]: __( 'Large' ),
	[ IMAGE_SIZE_FULL_SIZE ]: __( 'Full Size' ),
};

class ImageSizePicker extends Component {
	getSizeOptionsItems() {
		return [
			{ value: IMAGE_SIZE_THUMBNAIL, label: sizeOptionLabels[ IMAGE_SIZE_THUMBNAIL ] },
			{ value: IMAGE_SIZE_MEDIUM, label: sizeOptionLabels[ IMAGE_SIZE_MEDIUM ] },
			{ value: IMAGE_SIZE_LARGE, label: sizeOptionLabels[ IMAGE_SIZE_LARGE ] },
			{ value: IMAGE_SIZE_FULL_SIZE, label: sizeOptionLabels[ IMAGE_SIZE_FULL_SIZE ] },
		];
	}

	render() {
		let picker;

		const sizeOptions = this.getSizeOptionsItems();

		const onPickerPresent = () => {
			picker.presentPicker();
		};

		const getImageSizeOptions = () => (
			<Picker
				hideCancelButton={ true }
				title={ __( 'Image Size' ) }
				ref={ ( instance ) => picker = instance }
				options={ sizeOptions }
				leftAlign={ true }
				onChange={ this.props.onChange }
			/>
		);

		//Container component can use this prop to gain a reference to our onPickerPresent function
		this.props.referenceOpenImageOptions( { openImageOptions: onPickerPresent } );

		return getImageSizeOptions();
	}
}

ImageSizePicker.DEFAULT_SIZE_SLUG = DEFAULT_SIZE_SLUG;
ImageSizePicker.sizeOptionLabels = sizeOptionLabels;

export default ImageSizePicker;
