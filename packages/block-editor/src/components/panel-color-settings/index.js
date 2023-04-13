/**
 * Internal dependencies
 */
import PanelColorGradientSettings from '../colors-gradients/panel-color-gradient-settings';

const PanelColorSettings = ( { colorSettings, ...props } ) => {
	const settings = colorSettings.map( ( setting ) => {
		if ( ! setting ) {
			return setting;
		}
		const { value, onChange, ...otherSettings } = setting;
		return {
			...otherSettings,
			colorValue: value,
			onColorChange: onChange,
		};
	} );
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
