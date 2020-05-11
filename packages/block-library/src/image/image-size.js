/**
 * WordPress dependencies
 */
import { withGlobalEvents } from '@wordpress/compose';
import { useRef, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { calculatePreferedImageSize } from './utils';

function ImageSize( { src, dirtynessTrigger, children } ) {
	const ref = useRef();
	const [ state, setState ] = useState( {
		imageWidth: null,
		imageHeight: null,
		containerWidth: null,
		containerHeight: null,
		imageWidthWithinContainer: null,
		imageHeightWithinContainer: null,
	} );

	useEffect( () => {
		const image = new window.Image();

		image.onload = () => {
			const { width, height } = calculatePreferedImageSize(
				image,
				ref.current
			);

			setState( {
				imageWidth: image.width,
				imageHeight: image.height,
				containerWidth: ref.current.clientWidth,
				containerHeight: ref.current.clientHeight,
				imageWidthWithinContainer: width,
				imageHeightWithinContainer: height,
			} );
		};

		image.src = src;

		return () => {
			image.onload = undefined;
		};
	}, [ src, dirtynessTrigger ] );

	return <div ref={ ref }>{ children( state ) }</div>;
}

export default withGlobalEvents( {
	resize: 'calculateSize',
} )( ImageSize );
