import { useEffect, useState } from 'react';

function useImageSize( src ) {
	const [ { width, height }, updateSize ] = useState( {} );

	useEffect( () => {
		const image = new window.Image();
		image.onload = () => {
			updateSize( { width: image.width, height: image.height } );
		};
		image.src = src;
	}, [ src ] );

	return [ width, height ];
}

export default useImageSize;
