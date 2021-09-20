/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useGlobalStyles } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PanelColorGradientSettings from '../components/colors-gradients/panel-color-gradient-settings';
import ContrastChecker from '../components/contrast-checker';
import InspectorControls from '../components/inspector-controls';

const ColorPanel = ( { settings } ) => {
	const globalStyles = useGlobalStyles();
	const detectedColor = globalStyles.color;
	const detectedBackgroundColor = globalStyles.backgroundColor;

	return (
		<InspectorControls>
			<PanelColorGradientSettings
				title={ __( 'Color' ) }
				initialOpen={ false }
				settings={ settings }
				backgroundColor={ detectedBackgroundColor }
				textColor={ detectedColor }
			>
				<ContrastChecker
					backgroundColor={ detectedBackgroundColor }
					textColor={ detectedColor }
				/>
			</PanelColorGradientSettings>
		</InspectorControls>
	);
};

export default ColorPanel;
