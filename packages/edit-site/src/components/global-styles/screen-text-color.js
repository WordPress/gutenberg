/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalColorGradientControl as ColorGradientControl,
	useGlobalStylesSetting as useSetting,
	useStyle,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { getSupportedGlobalStylesPanels, useColorsPerOrigin } from './hooks';

function ScreenTextColor( { name, variationPath = '' } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );
	const [ isTextEnabled ] = useSetting( 'color.text', name );

	const colorsPerOrigin = useColorsPerOrigin( name );

	const hasTextColor =
		supports.includes( 'color' ) &&
		isTextEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );

	const [ color, setColor ] = useStyle( variationPath + 'color.text', name );
	const [ userColor ] = useStyle(
		variationPath + 'color.text',
		name,
		'user'
	);

	if ( ! hasTextColor ) {
		return null;
	}

	return (
		<>
			<ScreenHeader
				title={ __( 'Text' ) }
				description={ __(
					'Set the default color used for text across the site.'
				) }
			/>
			<ColorGradientControl
				className="edit-site-screen-text-color__control"
				colors={ colorsPerOrigin }
				disableCustomColors={ ! areCustomSolidsEnabled }
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

export default ScreenTextColor;
