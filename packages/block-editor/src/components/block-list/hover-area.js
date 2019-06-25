/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

const useHoveredArea = ( wrapper ) => {
	const [ hoveredArea, setHoveredArea ] = useState( null );

	useEffect( () => {
		const onMouseLeave = () => {
			if ( hoveredArea ) {
				setHoveredArea( null );
			}
		};

		const onMouseMove = ( event ) => {
			const { width, left, right } = wrapper.current.getBoundingClientRect();

			let newHoveredArea = null;
			if ( ( event.clientX - left ) < width / 3 ) {
				newHoveredArea = 'left';
			} else if ( ( right - event.clientX ) < width / 3 ) {
				newHoveredArea = 'right';
			}

			setHoveredArea( newHoveredArea );
		};

		wrapper.current.addEventListener( 'mousemove', onMouseMove );
		wrapper.current.addEventListener( 'mouseleave', onMouseLeave );

		return () => {
			wrapper.current.removeEventListener( 'mousemove', onMouseMove );
			wrapper.current.removeEventListener( 'mouseleave', onMouseLeave );
		};
	}, [] );

	return hoveredArea;
};

export default useHoveredArea;
