/**
 * External dependencies
 */
import classnames from 'classnames';
import { every, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, ColorIndicator } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
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
	const userColors = useSetting( 'color.palette.user' );
	const themeColors = useSetting( 'color.palette.theme' );
	const coreColors = useSetting( 'color.palette.core' );
	const shouldDisplayCoreColors = useSetting( 'color.corePalette' );

	colorGradientSettings.colors = useMemo( () => {
		const result = [];
		if ( shouldDisplayCoreColors && coreColors && coreColors.length ) {
			result.push( {
				name: __( 'Core' ),
				colors: coreColors,
			} );
		}
		if ( themeColors && themeColors.length ) {
			result.push( {
				name: __( 'Theme' ),
				colors: themeColors,
			} );
		}
		if ( userColors && userColors.length ) {
			result.push( {
				name: __( 'User' ),
				colors: userColors,
			} );
		}
		return result;
	}, [ coreColors, themeColors, userColors ] );

	const userGradients = useSetting( 'color.gradients.user' );
	const themeGradients = useSetting( 'color.gradients.theme' );
	const coreGradients = useSetting( 'color.gradients.core' );
	const shouldDisplayCoreGradients = useSetting( 'color.coreGradients' );
	colorGradientSettings.gradients = useMemo( () => {
		const result = [];
		if (
			shouldDisplayCoreGradients &&
			coreGradients &&
			coreGradients.length
		) {
			result.push( {
				name: __( 'Core' ),
				gradients: coreGradients,
			} );
		}
		if ( themeGradients && themeGradients.length ) {
			result.push( {
				name: __( 'Theme' ),
				gradients: themeGradients,
			} );
		}
		if ( userGradients && userGradients.length ) {
			result.push( {
				name: __( 'User' ),
				gradients: userGradients,
			} );
		}
		return result;
	}, [ userGradients, themeGradients, coreGradients ] );
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
