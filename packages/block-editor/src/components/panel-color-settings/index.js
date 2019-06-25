/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, ColorIndicator } from '@wordpress/components';
import { ifCondition } from '@wordpress/compose';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorPaletteControl from '../color-palette/control';
import withColorContext from '../color-palette/with-color-context';
import { getColorObjectByColorValue } from '../colors';

const hasCustomColorsDisabledForSetting = ( disableCustomColors, colorSetting ) => {
	if ( colorSetting.disableCustomColors !== undefined ) {
		return colorSetting.disableCustomColors;
	}
	return disableCustomColors;
};

const hasColorsToChooseInSetting = (
	colors = [],
	disableCustomColors,
	colorSetting ) => {
	if ( ! hasCustomColorsDisabledForSetting( disableCustomColors, colorSetting ) ) {
		return true;
	}
	return ( colorSetting.colors || colors ).length > 0;
};

const hasColorsToChoose = ( { colors, disableCustomColors, colorSettings } ) => {
	return some( colorSettings, ( colorSetting ) => {
		return hasColorsToChooseInSetting(
			colors,
			disableCustomColors,
			colorSetting
		);
	} );
};

// translators: first %s: The type of color (e.g. background color), second %s: the color name or value (e.g. red or #ff0000)
const colorIndicatorAriaLabel = __( '(%s: %s)' );

const renderColorIndicators = ( colorSettings, colors ) => {
	return colorSettings.map(
		( { value, label, colors: availableColors }, index ) => {
			if ( ! value ) {
				return null;
			}

			const colorObject = getColorObjectByColorValue(
				availableColors || colors,
				value
			);
			const colorName = colorObject && colorObject.name;
			const ariaLabel = sprintf(
				colorIndicatorAriaLabel,
				label.toLowerCase(),
				colorName || value
			);

			return (
				<ColorIndicator
					key={ index }
					colorValue={ value }
					aria-label={ ariaLabel }
				/>
			);
		}
	);
};

// colorSettings is passed as an array of props so that it can be used for
// mapping both ColorIndicator and ColorPaletteControl components. Passing
// an array of components/nodes here wouldn't be feasible.
export const PanelColorSettings = ifCondition( hasColorsToChoose )(
	( {
		children,
		colors,
		colorSettings,
		disableCustomColors,
		title,
		...props
	} ) => {
		const titleElement = (
			<span className="editor-panel-color-settings__panel-title block-editor-panel-color-settings__panel-title">
				{ title }
				{ renderColorIndicators( colorSettings, colors ) }
			</span>
		);

		return (
			<PanelBody
				className="editor-panel-color-settings block-editor-panel-color-settings"
				title={ titleElement }
				{ ...props }
			>
				{ colorSettings.map( ( settings, index ) => (
					<ColorPaletteControl
						key={ index }
						{ ...{
							colors,
							disableCustomColors,
							...settings,
						} }
					/>
				) ) }

				{ children }
			</PanelBody>
		);
	}
);

export default withColorContext( PanelColorSettings );
