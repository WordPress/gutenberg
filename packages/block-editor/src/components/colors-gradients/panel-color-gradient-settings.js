/**
 * External dependencies
 */
import classnames from 'classnames';
import { every, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, ColorIndicator } from '@wordpress/components';
import { sprintf, __, _x } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorGradientControl from './control';
import { getColorObjectByColorValue } from '../colors';
import { __experimentalGetGradientObjectByGradientValue } from '../gradients';
import useSetting from '../use-setting';

// translators: first %s: The type of color or gradient (e.g. background, overlay...), second %s: the color name or value (e.g. red or #ff0000)
const colorIndicatorAriaLabel = __( '(%s: color %s)' );

// translators: first %s: The type of color or gradient (e.g. background, overlay...), second %s: the color name or value (e.g. red or #ff0000)
const gradientIndicatorAriaLabel = __( '(%s: gradient %s)' );

const colorsAndGradientKeys = [
	'colors',
	'disableCustomColors',
	'gradients',
	'disableCustomGradients',
];

const Indicators = ( { colors, gradients, settings } ) => {
	return settings.map(
		(
			{
				colorValue,
				gradientValue,
				label,
				colors: availableColors,
				gradients: availableGradients,
			},
			index
		) => {
			if ( ! colorValue && ! gradientValue ) {
				return null;
			}
			let ariaLabel;
			if ( colorValue ) {
				const colorObject = getColorObjectByColorValue(
					availableColors || colors,
					colorValue
				);
				ariaLabel = sprintf(
					colorIndicatorAriaLabel,
					label.toLowerCase(),
					( colorObject && colorObject.name ) || colorValue
				);
			} else {
				const gradientObject = __experimentalGetGradientObjectByGradientValue(
					availableGradients || gradients,
					colorValue
				);
				ariaLabel = sprintf(
					gradientIndicatorAriaLabel,
					label.toLowerCase(),
					( gradientObject && gradientObject.name ) || gradientValue
				);
			}

			return (
				<ColorIndicator
					key={ index }
					colorValue={ colorValue || gradientValue }
					aria-label={ ariaLabel }
				/>
			);
		}
	);
};

export const PanelColorGradientSettingsInner = ( {
	className,
	colors,
	gradients,
	disableCustomColors,
	disableCustomGradients,
	children,
	settings,
	title,
	showTitle = true,
	__experimentalHasMultipleOrigins,
	enableAlpha,
	...props
} ) => {
	if (
		isEmpty( colors ) &&
		isEmpty( gradients ) &&
		disableCustomColors &&
		disableCustomGradients &&
		every(
			settings,
			( setting ) =>
				isEmpty( setting.colors ) &&
				isEmpty( setting.gradients ) &&
				( setting.disableCustomColors === undefined ||
					setting.disableCustomColors ) &&
				( setting.disableCustomGradients === undefined ||
					setting.disableCustomGradients )
		)
	) {
		return null;
	}

	const titleElement = (
		<span className="block-editor-panel-color-gradient-settings__panel-title">
			{ title }
			<Indicators
				colors={ colors }
				gradients={ gradients }
				settings={ settings }
			/>
		</span>
	);

	return (
		<PanelBody
			className={ classnames(
				'block-editor-panel-color-gradient-settings',
				className
			) }
			title={ showTitle ? titleElement : undefined }
			{ ...props }
		>
			{ settings.map( ( setting, index ) => (
				<ColorGradientControl
					showTitle={ showTitle }
					key={ index }
					{ ...{
						colors,
						gradients,
						disableCustomColors,
						disableCustomGradients,
						__experimentalHasMultipleOrigins,
						enableAlpha,
						...setting,
					} }
				/>
			) ) }
			{ children }
		</PanelBody>
	);
};

function useCommonSingleMultipleSelects() {
	return {
		disableCustomColors: ! useSetting( 'color.custom' ),
		disableCustomGradients: ! useSetting( 'color.customGradient' ),
	};
}

const PanelColorGradientSettingsSingleSelect = ( props ) => {
	const colorGradientSettings = useCommonSingleMultipleSelects();
	colorGradientSettings.colors = useSetting( 'color.palette' );
	colorGradientSettings.gradients = useSetting( 'color.gradients' );
	return (
		<PanelColorGradientSettingsInner
			{ ...{ ...colorGradientSettings, ...props } }
		/>
	);
};

const PanelColorGradientSettingsMultipleSelect = ( props ) => {
	const colorGradientSettings = useCommonSingleMultipleSelects();
	const customColors = useSetting( 'color.palette.custom' );
	const themeColors = useSetting( 'color.palette.theme' );
	const defaultColors = useSetting( 'color.palette.default' );
	const shouldDisplayDefaultColors = useSetting( 'color.defaultPalette' );

	colorGradientSettings.colors = useMemo( () => {
		const result = [];
		if ( themeColors && themeColors.length ) {
			result.push( {
				name: _x(
					'Theme',
					'Indicates this palette comes from the theme.'
				),
				colors: themeColors,
			} );
		}
		if (
			shouldDisplayDefaultColors &&
			defaultColors &&
			defaultColors.length
		) {
			result.push( {
				name: _x(
					'Default',
					'Indicates this palette comes from WordPress.'
				),
				colors: defaultColors,
			} );
		}
		if ( customColors && customColors.length ) {
			result.push( {
				name: _x(
					'Custom',
					'Indicates this palette comes from the theme.'
				),
				colors: customColors,
			} );
		}
		return result;
	}, [ defaultColors, themeColors, customColors ] );

	const customGradients = useSetting( 'color.gradients.custom' );
	const themeGradients = useSetting( 'color.gradients.theme' );
	const defaultGradients = useSetting( 'color.gradients.default' );
	const shouldDisplayDefaultGradients = useSetting(
		'color.defaultGradients'
	);
	colorGradientSettings.gradients = useMemo( () => {
		const result = [];
		if ( themeGradients && themeGradients.length ) {
			result.push( {
				name: _x(
					'Theme',
					'Indicates this palette comes from the theme.'
				),
				gradients: themeGradients,
			} );
		}
		if (
			shouldDisplayDefaultGradients &&
			defaultGradients &&
			defaultGradients.length
		) {
			result.push( {
				name: _x(
					'Default',
					'Indicates this palette comes from WordPress.'
				),
				gradients: defaultGradients,
			} );
		}
		if ( customGradients && customGradients.length ) {
			result.push( {
				name: _x(
					'Custom',
					'Indicates this palette is created by the user.'
				),
				gradients: customGradients,
			} );
		}
		return result;
	}, [ customGradients, themeGradients, defaultGradients ] );
	return (
		<PanelColorGradientSettingsInner
			{ ...{ ...colorGradientSettings, ...props } }
		/>
	);
};

const PanelColorGradientSettings = ( props ) => {
	if (
		every( colorsAndGradientKeys, ( key ) => props.hasOwnProperty( key ) )
	) {
		return <PanelColorGradientSettingsInner { ...props } />;
	}
	if ( props.__experimentalHasMultipleOrigins ) {
		return <PanelColorGradientSettingsMultipleSelect { ...props } />;
	}
	return <PanelColorGradientSettingsSingleSelect { ...props } />;
};

export default PanelColorGradientSettings;
