import { useEffect, useState } from 'react';

function useElementSize( element, dirtynessTrigger ) {
	const [ { width, height }, updateSize ] = useState( {} );

	const updateContainerSize = () => {
		updateSize( {
			width: element ? element.clientWidth : undefined,
			height: element ? element.clientHeight : undefined,
		} );
	};
	useEffect( updateContainerSize, [ element, dirtynessTrigger ] );

	// This could be refactored using a `useGlobalEvent`
	// to avoid subscribing multiple times to the same event
	// Similar to withGlobalEvent.
	useEffect( () => {
		window.addEventListener( 'resize', updateContainerSize );
		return () => window.removeEventListener( 'resize', updateContainerSize );
	}, [] );

	return [ width, height ];
}

export default useElementSize;
