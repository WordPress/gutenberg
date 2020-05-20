/**
 * WordPress dependencies
 */
import { useRef, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { calculatePreferedImageSize } from './utils';

export default function ImageSize( { src, dirtynessTrigger, children } ) {
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
		const { defaultView } = ref.current.ownerDocument;
		const image = new defaultView.Image();

		function calculateSize() {
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
		}

		defaultView.addEventListener( 'resize', calculateSize );
		image.addEventListener( 'load', calculateSize );
		image.src = src;

		return () => {
			defaultView.removeEventListener( 'resize', calculateSize );
			image.removeEventListener( 'load', calculateSize );
		};
	}, [ src, dirtynessTrigger ] );

	return <div ref={ ref }>{ children( state ) }</div>;
}
