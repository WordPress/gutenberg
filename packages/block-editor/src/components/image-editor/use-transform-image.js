/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

function useTransformState( { url, naturalWidth, naturalHeight } ) {
	const [ editedUrl, setEditedUrl ] = useState();
	const [ crop, setCrop ] = useState();
	const [ position, setPosition ] = useState( { x: 0, y: 0 } );
	const [ zoom, setZoom ] = useState();
	const [ rotation, setRotation ] = useState();
	const [ aspect, setAspect ] = useState();
	const [ defaultAspect, setDefaultAspect ] = useState();

	const initializeTransformValues = useCallback( () => {
		setPosition( { x: 0, y: 0 } );
		setZoom( 100 );
		setRotation( 0 );
		setAspect( naturalWidth / naturalHeight );
		setDefaultAspect( naturalWidth / naturalHeight );
	}, [
		naturalWidth,
		naturalHeight,
		setPosition,
		setZoom,
		setRotation,
		setAspect,
		setDefaultAspect,
	] );

	const rotateClockwise = useCallback( () => {
		const angle = ( rotation + 90 ) % 360;

		let naturalAspectRatio = naturalWidth / naturalHeight;

		if ( rotation % 180 === 90 ) {
			naturalAspectRatio = naturalHeight / naturalWidth;
		}

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

		const imgCrossOrigin = applyFilters(
			'media.crossOrigin',
			undefined,
			url
		);
		if ( typeof imgCrossOrigin === 'string' ) {
			el.crossOrigin = imgCrossOrigin;
		}
	}, [
		rotation,
		naturalWidth,
		naturalHeight,
		setEditedUrl,
		setRotation,
		setAspect,
		setPosition,
	] );

	return useMemo(
		() => ( {
			editedUrl,
			setEditedUrl,
			crop,
			setCrop,
			position,
			setPosition,
			zoom,
			setZoom,
			rotation,
			setRotation,
			rotateClockwise,
			aspect,
			setAspect,
			defaultAspect,
			initializeTransformValues,
		} ),
		[
			editedUrl,
			setEditedUrl,
			crop,
			setCrop,
			position,
			setPosition,
			zoom,
			setZoom,
			rotation,
			setRotation,
			rotateClockwise,
			aspect,
			setAspect,
			defaultAspect,
			initializeTransformValues,
		]
	);
}

export default function useTransformImage( imageProperties, isEditing ) {
	const transformState = useTransformState( imageProperties );
	const { initializeTransformValues } = transformState;

	useEffect( () => {
		if ( isEditing ) {
			initializeTransformValues();
		}
	}, [ isEditing, initializeTransformValues ] );

	return transformState;
}
