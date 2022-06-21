/**
 * WordPress dependencies
 */
import { __experimentalColorGradientControl as ColorGradientControl } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useSetting, useStyle, useColorsPerOrigin } from './hooks';

function ScreenElementColorpicker( { name, element, path } ) {
	const colorsPerOrigin = useColorsPerOrigin( name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );
	const [ color, setColor ] = useStyle( path, name );
	const [ userColor ] = useStyle( path, name, 'user' );

	return (
		<>
			<ColorGradientControl
				className={ `edit-site-screen-${ element }-color__control` }
				colors={ colorsPerOrigin }
				disableCustomColors={ ! areCustomSolidsEnabled }
				__experimentalHasMultipleOrigins
				showTitle={ false }
				enableAlpha
				__experimentalIsRenderedInSidebar
				colorValue={ color }
				onColorChange={ setColor }
				clearable={ color === userColor }
			/>
		</>
	);
}

export default ScreenElementColorpicker;
