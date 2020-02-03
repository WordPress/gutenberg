/**
 * External dependencies
 */
import classnames from 'classnames';
import { every, isEmpty, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, ColorIndicator } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ColorGradientControl from './control';
import { getColorObjectByColorValue } from '../colors';
import { __experimentalGetGradientObjectByGradientValue } from '../gradients';

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
			title={ titleElement }
			{ ...props }
		>
			{ settings.map( ( setting, index ) => (
				<ColorGradientControl
					key={ index }
					{ ...{
						colors,
						gradients,
						disableCustomColors,
						disableCustomGradients,
						...setting,
					} }
				/>
			) ) }
			{ children }
		</PanelBody>
	);
};

const PanelColorGradientSettingsSelect = ( props ) => {
	const colorGradientSettings = useSelect( ( select ) => {
		const settings = select( 'core/block-editor' ).getSettings();
		return pick( settings, colorsAndGradientKeys );
	} );
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
	return <PanelColorGradientSettingsSelect { ...props } />;
};

export default PanelColorGradientSettings;
