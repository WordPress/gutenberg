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
import { useSupportedStyles, useColorsPerOrigin } from './hooks';
import { unlock } from '../../experiments';

const { useGlobalSetting, useGlobalStyle } = unlock( blockEditorExperiments );

function ScreenTextColor( { name, variation = '' } ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const supports = useSupportedStyles( name );
	const [ areCustomSolidsEnabled ] = useGlobalSetting( 'color.custom', name );
	const [ isTextEnabled ] = useGlobalSetting( 'color.text', name );
	const colorsPerOrigin = useColorsPerOrigin( name );

	const hasTextColor =
		supports.includes( 'color' ) &&
		isTextEnabled &&
		( colorsPerOrigin.length > 0 || areCustomSolidsEnabled );

	const [ color, setColor ] = useGlobalStyle( prefix + 'color.text', name );
	const [ userColor ] = useGlobalStyle( prefix + 'color.text', name, 'user' );

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
				headingLevel={ 3 }
			/>
		</>
	);
}

export default ScreenTextColor;
