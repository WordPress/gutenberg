/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import PanelColorSettings from '../panel-color-settings';
import ContrastChecker from '../contrast-checker';

const resolveContrastCheckerColor = ( color, colorSettings, detectedColor ) => {
	if ( typeof color === 'function' ) {
		return color( colorSettings );
	} else if ( color === true ) {
		return detectedColor;
	}
	return color;
};

export default function ColorPanel( {
	title,
	colorSettings,
	colorPanelProps,
	contrastCheckers,
	detectedBackgroundColor,
	detectedColor,
	panelChildren,
	initialOpen,
} ) {
	return (
		<PanelColorSettings
			title={ title }
			initialOpen={ initialOpen }
			colorSettings={ Object.values( colorSettings ) }
			{ ...colorPanelProps }
		>
			{ contrastCheckers &&
				( Array.isArray( contrastCheckers )
					? contrastCheckers.map(
							( { backgroundColor, textColor, ...rest } ) => {
								backgroundColor = resolveContrastCheckerColor(
									backgroundColor,
									colorSettings,
									detectedBackgroundColor
								);
								textColor = resolveContrastCheckerColor(
									textColor,
									colorSettings,
									detectedColor
								);
								return (
									<ContrastChecker
										key={ `${ backgroundColor }-${ textColor }` }
										backgroundColor={ backgroundColor }
										textColor={ textColor }
										{ ...rest }
									/>
								);
							}
					  )
					: map( colorSettings, ( { value } ) => {
							let {
								backgroundColor,
								textColor,
							} = contrastCheckers;
							backgroundColor = resolveContrastCheckerColor(
								backgroundColor || value,
								colorSettings,
								detectedBackgroundColor
							);
							textColor = resolveContrastCheckerColor(
								textColor || value,
								colorSettings,
								detectedColor
							);
							return (
								<ContrastChecker
									{ ...contrastCheckers }
									key={ `${ backgroundColor }-${ textColor }` }
									backgroundColor={ backgroundColor }
									textColor={ textColor }
								/>
							);
					  } ) ) }
			{ typeof panelChildren === 'function'
				? panelChildren( colorSettings )
				: panelChildren }
		</PanelColorSettings>
	);
}
