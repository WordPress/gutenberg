/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
* External dependencies
*/
import { View, Image } from 'react-native';

/**
 * Internal dependencies
 */
import { calculatePreferedImageSize } from './utils';

class ImageSize extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			width: undefined,
			height: undefined,
		};
		this.onLayout = this.onLayout.bind( this );
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
		Image.getSize( this.props.src, ( width, height ) => {
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
