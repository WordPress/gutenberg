/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEVICE_PREVIEW_WIDTHS, DEVICE_PREVIEW_HEIGHTS } from './constants';

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
		const deviceWidth = DEVICE_PREVIEW_WIDTHS[ device ];

		if ( deviceWidth === null || deviceWidth === undefined ) {
			return null;
		}

		return deviceWidth < actualWidth ? deviceWidth : actualWidth;
	};

	const contentInlineStyles = ( device ) => {
		const height = DEVICE_PREVIEW_HEIGHTS[ device ];
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
					height: height ? `${ height }px` : undefined,
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
