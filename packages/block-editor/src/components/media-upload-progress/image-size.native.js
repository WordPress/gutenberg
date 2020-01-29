/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * External dependencies
 */
import { View, Image as RNImage } from 'react-native';

/**
 * Internal dependencies
 */

function calculatePreferedImageSize( image, container ) {
	const maxWidth = container.clientWidth;
	const exceedMaxWidth = image.width > maxWidth;
	const ratio = image.height / image.width;
	const width = exceedMaxWidth ? maxWidth : image.width;
	const height = exceedMaxWidth ? maxWidth * ratio : image.height;
	return { width, height };
}

const Image = {
	getSize: ( src, callback ) => {
		let cancelled = false;
		RNImage.getSize( src, ( ...args ) => ! cancelled && callback( ...args ) );
		return { cancel: () => cancelled = true };
	},
};

class ImageSize extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			width: undefined,
			height: undefined,
		};
		this.onLayout = this.onLayout.bind( this );
		this.pendingGetSizeRequest = null;
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.src !== prevProps.src ) {
			this.image = {};

			this.setState( {
				width: undefined,
				height: undefined,
			} );
			this.fetchImageSize();
		}

		if ( this.props.dirtynessTrigger !== prevProps.dirtynessTrigger ) {
			this.calculateSize();
		}
	}

	componentDidMount() {
		this.fetchImageSize();
	}

	fetchImageSize() {
		if ( this.getSizeRequest ) {
			this.getSizeRequest.cancel();
		}

		this.getSizeRequest = Image.getSize( this.props.src, ( width, height ) => {
			this.image = { width, height };
			this.calculateSize();
		} );
	}

	calculateSize() {
		if ( this.image === undefined || this.container === undefined ) {
			return;
		}
		const { width, height } = calculatePreferedImageSize( this.image, this.container );
		this.setState( { width, height } );
	}

	onLayout( event ) {
		const { width, height } = event.nativeEvent.layout;
		this.container = {
			clientWidth: width,
			clientHeight: height,
		};
		this.calculateSize();
	}

	componentWillUnmount() {
		if ( this.getSizeRequest ) {
			this.getSizeRequest.cancel();
		}
	}

	render() {
		const sizes = {
			imageWidth: this.image && this.image.width,
			imageHeight: this.image && this.image.height,
			containerWidth: this.container && this.container.width,
			containerHeight: this.container && this.container.height,
			imageWidthWithinContainer: this.state.width,
			imageHeightWithinContainer: this.state.height,
		};
		return (
			<View onLayout={ this.onLayout }>
				{ this.props.children( sizes ) }
			</View>
		);
	}
}

export default ImageSize;
