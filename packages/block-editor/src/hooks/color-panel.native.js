/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useGlobalStyles } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PanelColorGradientSettings from '../components/colors-gradients/panel-color-gradient-settings';
import ContrastChecker from '../components/contrast-checker';
import InspectorControls from '../components/inspector-controls';

const ColorPanel = ( { settings } ) => {
	const globalStyles = useGlobalStyles();

	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedTextColor, setDetectedTextColor ] = useState();

	const { baseGlobalStyles } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			baseGlobalStyles:
				getSettings()?.__experimentalGlobalStylesBaseStyles?.color,
		};
	} );

	useEffect( () => {
		// The following logic is used to determine current text/background colors:
		// 1. The globalStyles object is queried to determine whether a color has been
		// set via a block's settings.
		// 2. If a block-based theme is in use and no globalStyles exist, the theme's
		// default/base colors are used.
		// 3. If no globalStyles exist and a theme isn't block-based, there is no way
		// to determine the default text/background color and the checker won't run.
		const textColor = globalStyles?.color || baseGlobalStyles?.text;
		const backgroundColor =
			globalStyles?.backgroundColor || baseGlobalStyles?.background;

		setDetectedTextColor( textColor );
		setDetectedBackgroundColor( backgroundColor );
	}, [ globalStyles, baseGlobalStyles ] );

	return (
		<InspectorControls>
			<PanelColorGradientSettings
				title={ __( 'Color' ) }
				initialOpen={ false }
				settings={ settings }
			>
				<ContrastChecker
					backgroundColor={ detectedBackgroundColor }
					textColor={ detectedTextColor }
				/>
			</PanelColorGradientSettings>
		</InspectorControls>
	);
};

export default ColorPanel;
