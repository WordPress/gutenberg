import PanelColorGradientSettings from '../colors-gradients/panel-color-gradient-settings';
import type { PanelColorSettingsProps } from './types';

const PanelColorSettings = ( {
	colorSettings,
	...props
}: PanelColorSettingsProps ) => {
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
			disableCustomGradients
			{ ...props }
		/>
	);
};
export default PanelColorSettings;
