/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { default as useSimulatedMediaQuery } from '../../components/use-simulated-media-query';

/**
 * Function to resize the editor window.
 *
 * @param {string}  deviceType                  Used for determining the size of the container (e.g. Desktop, Tablet, Mobile)
 * @param {boolean} __unstableDisableSimulation Whether to disable media query simulation.
 *
 * @return {Object} Inline styles to be added to resizable container.
 */
export default function useResizeCanvas(
	deviceType,
	__unstableDisableSimulation
) {
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

	const marginValue = () => ( window.innerHeight < 800 ? 36 : 72 );

	const contentInlineStyles = ( device ) => {
		const height = device === 'Mobile' ? '768px' : '1024px';
		switch ( device ) {
			case 'Tablet':
			case 'Mobile':
				return {
					width: getCanvasWidth( device ),
					margin: marginValue() + 'px auto',
					height,
					borderRadius: '2px 2px 2px 2px',
					border: '1px solid #ddd',
					overflowY: 'auto',
				};
			default:
				return null;
		}
	};

	const width = __unstableDisableSimulation
		? null
		: getCanvasWidth( deviceType );

	useSimulatedMediaQuery( 'resizable-editor-section', width );

	return contentInlineStyles( deviceType );
}
