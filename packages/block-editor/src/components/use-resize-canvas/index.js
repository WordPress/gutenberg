/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Function to resize the editor window.
 *
 * @param {string} deviceType Used for determining the size of the container (e.g. Desktop, Tablet, Mobile)
 *
 * @return {Object} Inline styles to be added to resizable container.
 */
export default function useResizeCanvas( deviceType ) {
	const [ actualWidth, updateActualWidth ] = useState( window.innerWidth );

	useEffect( () => {
		if ( deviceType === 'Desktop' ) {
			return;
		}

		const resizeListener = () => updateActualWidth( window.innerWidth );
		window.addEventListener( 'resize', resizeListener );

		return () => {
			window.removeEventListener( 'resize', resizeListener );
		};
	}, [ deviceType ] );

	const getCanvasWidth = ( device ) => {
		let deviceWidth;

		/*
		 * Matches the breakpoints in packages/base-styles/_breakpoints.scss,
		 * and breakpoints in packages/compose/src/hooks/use-viewport-match/index.js.
		 * minus 1 to trigger the media query for device preview.
		 */
		switch ( device ) {
			case 'Tablet':
				deviceWidth = 782 - 1; // preview for useViewportMatch( 'medium', '<' )
				break;
			case 'Mobile':
				deviceWidth = 480 - 1; // preview for useViewportMatch( 'mobile', '<' )
				break;
			default:
				return null;
		}

		return deviceWidth < actualWidth ? deviceWidth : actualWidth;
	};

	const contentInlineStyles = ( device ) => {
		const height = device === 'Mobile' ? '768px' : '1024px';
		const marginVertical = '40px';
		const marginHorizontal = 'auto';

		switch ( device ) {
			case 'Tablet':
			case 'Mobile':
				return {
					width: getCanvasWidth( device ),
					// Keeping margin styles separate to avoid warnings
					// when those props get overridden in the iframe component
					marginTop: marginVertical,
					marginBottom: marginVertical,
					marginLeft: marginHorizontal,
					marginRight: marginHorizontal,
					height,
					overflowY: 'auto',
				};
			default:
				return {
					marginLeft: marginHorizontal,
					marginRight: marginHorizontal,
				};
		}
	};

	return contentInlineStyles( deviceType );
}
