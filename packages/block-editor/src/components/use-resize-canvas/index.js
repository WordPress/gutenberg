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

		switch ( device ) {
			case 'Tablet':
				deviceWidth = 780;
				break;
			case 'Mobile':
				deviceWidth = 360;
				break;
			default:
				return null;
		}

		return deviceWidth < actualWidth ? deviceWidth : actualWidth;
	};

	const marginValue = () => ( window.innerHeight < 800 ? 36 : 64 );

	const contentInlineStyles = ( device ) => {
		const height = device === 'Mobile' ? '768px' : '1024px';
		const marginVertical = marginValue() + 'px';
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
