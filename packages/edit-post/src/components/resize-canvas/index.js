/**
 * WordPress dependencies
 */
import { useSimulatedMediaQuery } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Function to resize the editor window.
 *
 * @return {Object} Inline styles to be added to resizable container.
 */
export function useResizeCanvas() {
	const deviceType = useSelect( ( select ) => {
		return select( 'core/edit-post' ).__experimentalGetPreviewDeviceType();
	}, [] );

	const [ actualWidth, updateActualWidth ] = useState( window.innerWidth );

	useEffect( () => {
		const resizeListener = () => updateActualWidth( window.innerWidth );
		window.addEventListener( 'resize', resizeListener );

		return () => {
			window.removeEventListener( 'resize', resizeListener );
		};
	} );

	const getCanvasWidth = ( device ) => {
		let deviceWidth = 0;

		switch ( device ) {
			case 'Tablet':
				deviceWidth = 780;
				break;
			case 'Mobile':
				deviceWidth = 360;
				break;
			default:
				deviceWidth = 2000;
		}

		return deviceWidth < actualWidth ? deviceWidth : actualWidth;
	};

	const marginValue = () => ( window.innerHeight < 800 ? 36 : 72 );

	const contentInlineStyles = ( device ) => {
		switch ( device ) {
			case 'Tablet':
			case 'Mobile':
				return {
					width: getCanvasWidth( device ),
					margin: marginValue() + 'px auto',
					flexGrow: 0,
					maxHeight: device === 'Mobile' ? '768px' : '1024px',
					overflowY: 'auto',
				};
			default:
				return null;
		}
	};

	useSimulatedMediaQuery(
		'resizable-editor-section',
		getCanvasWidth( deviceType )
	);

	return contentInlineStyles( deviceType );
}
