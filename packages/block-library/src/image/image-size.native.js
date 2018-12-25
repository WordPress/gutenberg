/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
* External dependencies
*/
import { View, Image } from 'react-native';

class ImageSize extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			width: undefined,
			height: undefined,
		};
		this.bindContainer = this.bindContainer.bind( this );
        this.calculateSize = this.calculateSize.bind( this );
        this.onLayout = this.onLayout.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.src !== prevProps.src ) {
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
		Image.getSize( this.props.src, ( imageRealWidth, imageRealHeight ) => {
			const image = {};
			image.width = imageRealWidth;
			image.height = imageRealHeight;
            this.image = image;
            this.calculateSize();
		} );
	}

	calculateSize() {
		if ( this.image === undefined || this.container === undefined ) {
			return;
		}

		const maxWidth = this.container.clientWidth;
		const exceedMaxWidth = this.image.width > maxWidth;
		const ratio = this.image.height / this.image.width;
		const width = exceedMaxWidth ? maxWidth : this.image.width;
		const height = exceedMaxWidth ? maxWidth * ratio : this.image.height;
		this.setState( { width, height } );
	}

	onLayout( event ) {
		const { width, height } = event.nativeEvent.layout;
		const container = {};
		container.clientWidth = width;
		container.clientHeight = height;
        this.container = container;
        this.calculateSize();
	}

	render() {
		const sizes = {
			imageWidth: this.image && this.image.width,
			imageHeight: this.image && this.image.height,
			containerWidth: this.container && this.container.clientWidth,
			containerHeight: this.container && this.container.clientHeight,
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