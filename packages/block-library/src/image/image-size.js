/**
 * WordPress dependencies
 */
import { useGlobalEvent } from '@wordpress/compose';
import { useRef, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { calculatePreferedImageSize } from './utils';

export default function ImageSize( { src, dirtynessTrigger, children } ) {
	const ref = useRef();
	const image = useRef();
	const [ state, setState ] = useState( {
		imageWidth: null,
		imageHeight: null,
		containerWidth: null,
		containerHeight: null,
		imageWidthWithinContainer: null,
		imageHeightWithinContainer: null,
	} );

	function calculateSize() {
		const { width, height } = calculatePreferedImageSize(
			image.current,
			ref.current
		);

		setState( {
			imageWidth: image.current.width,
			imageHeight: image.current.height,
			containerWidth: ref.current.clientWidth,
			containerHeight: ref.current.clientHeight,
			imageWidthWithinContainer: width,
			imageHeightWithinContainer: height,
		} );
	}

	useEffect( () => {
		if ( ! image.current ) {
			const { defaultView } = ref.current.ownerDocument;
			image.current = new defaultView.Image();
		}

		image.current.onload = calculateSize;
		image.current.src = src;

		return () => {
			image.current.onload = undefined;
		};
	}, [ src, dirtynessTrigger ] );

	useGlobalEvent( ref, [ 'resize', calculateSize ], [] );

	return <div ref={ ref }>{ children( state ) }</div>;
}
