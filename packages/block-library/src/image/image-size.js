/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { calculatePreferedImageSize } from './utils';

export default function useImageSize( ref, src, dependencies ) {
	const [ state, setState ] = useState( {
		imageWidth: null,
		imageHeight: null,
		imageWidthWithinContainer: null,
		imageHeightWithinContainer: null,
	} );

	useEffect( () => {
		if ( ! src ) {
			return;
		}

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
	}, [ src, ...dependencies ] );

	return state;
}
