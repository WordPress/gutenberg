/**
 * External dependencies
 */
import { View, Image, Text, TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class ImageSize extends Component {
    constructor() {
		super( ...arguments );
		this.state = {
			width: undefined,
			height: undefined,
		};
    }
    
    componentDidMount = () => {
		const { src } = this.props;

		Image.getSize(src, (imageRealWidth, imageRealHeight) => {
			this.image = {}
			this.image.width = imageRealWidth
			this.image.height = imageRealHeight
			this.calculateImageDimentions();
		});
    }
    
    onLayout = (event) => {
        let {width, height} = event.nativeEvent.layout;
        this.container = {};
        this.container.clientWidth = width;
        this.container.clientHeight = height;
		this.calculateImageDimentions();
    }

    calculateImageDimentions = () => {
		if (this.image === undefined || this.container === undefined) {
			return;
		}

		const maxWidth = this.container.clientWidth;
		const exceedMaxWidth = this.image.width > maxWidth;
		const ratio = this.image.height / this.image.width;
		const width = exceedMaxWidth ? maxWidth : this.image.width;
		const height = exceedMaxWidth ? maxWidth * ratio : this.image.height;
		this.setState( { width, height } );
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
            <View onLayout={this.onLayout}>
                { this.props.children( sizes ) }
            </View>
        )
    }
}

export default ImageSize;