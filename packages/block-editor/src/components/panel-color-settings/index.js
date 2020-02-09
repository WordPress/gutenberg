/**
 * Internal dependencies
 */
import PanelColorGradientSettings from '../colors-gradients/panel-color-gradient-settings';

const PanelColorSettings = ( { colorSettings, ...props } ) => {
	const settings = colorSettings.map(
		( { value, onChange, ...otherSettings } ) => ( {
			...otherSettings,
			colorValue: value,
			onColorChange: onChange,
		} )
	);
	return (
		<PanelColorGradientSettings
			settings={ settings }
			gradients={ [] }
			disableCustomGradients={ true }
			{ ...props }
		/>
	);
};
export default PanelColorSettings;
