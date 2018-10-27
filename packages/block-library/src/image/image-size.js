/**
 * External dependencies
 */
import { useRef, useMemo } from 'react';

/**
 * WordPress dependencies
 */
import { useImageSize, useElementSize } from '@wordpress/compose';

function ImageSize( { src, dirtynessTrigger, children } ) {
	const container = useRef( null );
	const [ imageWidth, imageHeight ] = useImageSize( src );
	const [ containerWidth, containerHeight ] = useElementSize( container.current, dirtynessTrigger );
	const sizes = useMemo( () => {
		const maxWidth = containerWidth;
		const exceedMaxWidth = imageWidth > maxWidth;
		const ratio = imageHeight / imageWidth;
		const width = exceedMaxWidth ? maxWidth : imageWidth;
		const height = exceedMaxWidth ? maxWidth * ratio : imageHeight;

		return {
			imageWidthWithinContainer: width,
			imageHeightWithinContainer: height,
			imageWidth,
			imageHeight,
			containerWidth,
			containerHeight,
		};
	}, [ imageWidth, imageHeight, containerWidth, containerHeight ] );

	return (
		<div ref={ container }>
			{ children( sizes ) }
		</div>
	);
}

export default ImageSize;
