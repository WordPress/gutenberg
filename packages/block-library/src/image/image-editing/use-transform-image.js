/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export default function useTransformImage( {
	url,
	naturalWidth,
	naturalHeight,
	width,
	height,
	clientWidth,
} ) {
	const [ editedUrl, setEditedUrl ] = useState();
	const [ crop, setCrop ] = useState( null );
	const [ position, setPosition ] = useState( { x: 0, y: 0 } );
	const [ zoom, setZoom ] = useState( 100 );
	const [ rotation, setRotation ] = useState( 0 );
	const [ aspect, setAspect ] = useState( naturalWidth / naturalHeight );

	// TODO - remove inlined logic.
	const editedWidth = width;
	let editedHeight = height || ( clientWidth * naturalHeight ) / naturalWidth;
	let naturalAspectRatio = naturalWidth / naturalHeight;

	if ( rotation % 180 === 90 ) {
		editedHeight = ( clientWidth * naturalWidth ) / naturalHeight;
		naturalAspectRatio = naturalHeight / naturalWidth;
	}

	function rotateClockwise() {
		const angle = ( rotation + 90 ) % 360;

		if ( angle === 0 ) {
			setEditedUrl();
			setRotation( angle );
			setAspect( 1 / aspect );
			setPosition( {
				x: -( position.y * naturalAspectRatio ),
				y: position.x * naturalAspectRatio,
			} );
			return;
		}

		function editImage( event ) {
			const canvas = document.createElement( 'canvas' );

			let translateX = 0;
			let translateY = 0;

			if ( angle % 180 ) {
				canvas.width = event.target.height;
				canvas.height = event.target.width;
			} else {
				canvas.width = event.target.width;
				canvas.height = event.target.height;
			}

			if ( angle === 90 || angle === 180 ) {
				translateX = canvas.width;
			}

			if ( angle === 270 || angle === 180 ) {
				translateY = canvas.height;
			}

			const context = canvas.getContext( '2d' );

			context.translate( translateX, translateY );
			context.rotate( ( angle * Math.PI ) / 180 );
			context.drawImage( event.target, 0, 0 );

			canvas.toBlob( ( blob ) => {
				setEditedUrl( URL.createObjectURL( blob ) );
				setRotation( angle );
				setAspect( 1 / aspect );
				setPosition( {
					x: -( position.y * naturalAspectRatio ),
					y: position.x * naturalAspectRatio,
				} );
			} );
		}

		const el = new window.Image();
		el.src = url;
		el.onload = editImage;
	}

	return {
		crop,
		setCrop,
		zoom,
		setZoom,
		rotation,
		rotateClockwise,
		aspect,
		setAspect,
		editedUrl,
		editedWidth,
		editedHeight,
	};
}
