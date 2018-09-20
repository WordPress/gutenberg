/**
 * External dependencies
 */
import { View, Image } from 'react-native';

export function fetchImageSize(src, onload, callback) {
	Image.getSize( src, ( imageRealWidth, imageRealHeight ) => {
		const image = {};
		image.width = imageRealWidth;
		image.height = imageRealHeight;
		callback(image);
		onload();
	} );
}

export function renderContainer(bindContainer, sizes, children, onLayout) {
	return (
		<View onLayout={ onLayout }>
			{ children( sizes ) }
		</View>
	);
}

export function onLayout( event, callback ) {
	const { width, height } = event.nativeEvent.layout;
	const container = {};
	container.clientWidth = width;
	container.clientHeight = height;
	callback(container);
}

export function exporter( component ) {
	return component
}