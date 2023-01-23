/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalColorGradientControl as ColorGradientControl,
	experiments as blockEditorExperiments,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { getSupportedGlobalStylesPanels, useColorsPerOrigin } from './hooks';
import { unlock } from '../../experiments';

const { useGlobalSetting, useGlobalStyle } = unlock( blockEditorExperiments );

function ScreenTextColor( { name, variationPath = '' } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useGlobalSetting( 'color.palette', name );
	const [ areCustomSolidsEnabled ] = useGlobalSetting( 'color.custom', name );
	const [ isTextEnabled ] = useGlobalSetting( 'color.text', name );

	const colorsPerOrigin = useColorsPerOrigin( name );

	const hasTextColor =
		supports.includes( 'color' ) &&
		isTextEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled );

	const [ color, setColor ] = useGlobalStyle(
		variationPath + 'color.text',
		name
	);
	const [ userColor ] = useGlobalStyle(
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
