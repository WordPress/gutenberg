/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';

/**
 * Retrieves color and gradient related settings.
 *
 * The arrays for colors and gradients are made up of color palettes from each
 * origin i.e. "Core", "Theme", and "User".
 *
 * @param {Object}  settings
 * @param {boolean} settings.isDisabled
 * @return {Object} Color and gradient related settings.
 */
export default function useMultipleOriginColorsAndGradients( {
	isDisabled,
} = {} ) {
	const { clientId = null } = useBlockEditContext();
	const [
		enableCustomColors,
		customColors,
		themeColors,
		defaultColors,
		shouldDisplayDefaultColors,
		enableCustomGradients,
		customGradients,
		themeGradients,
		defaultGradients,
		shouldDisplayDefaultGradients,
	] = useSelect(
		( select ) => {
			if ( isDisabled ) {
				return [];
			}
			return unlock( select( blockEditorStore ) ).getBlockSettings(
				clientId,
				'color.custom',
				'color.palette.custom',
				'color.palette.theme',
				'color.palette.default',
				'color.defaultPalette',
				'color.customGradient',
				'color.gradients.custom',
				'color.gradients.theme',
				'color.gradients.default',
				'color.defaultGradients'
			);
		},
		[ clientId, isDisabled ]
	);

	const colorGradientSettings = {
		disableCustomColors: ! enableCustomColors,
		disableCustomGradients: ! enableCustomGradients,
	};

	colorGradientSettings.colors = useMemo( () => {
		if ( isDisabled ) {
			return [];
		}
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
	}, [
		customColors,
		themeColors,
		defaultColors,
		shouldDisplayDefaultColors,
		isDisabled,
	] );

	colorGradientSettings.gradients = useMemo( () => {
		if ( isDisabled ) {
			return [];
		}
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
	}, [
		customGradients,
		themeGradients,
		defaultGradients,
		shouldDisplayDefaultGradients,
		isDisabled,
	] );

	if ( isDisabled ) {
		return {};
	}

	colorGradientSettings.hasColorsOrGradients =
		!! colorGradientSettings.colors.length ||
		!! colorGradientSettings.gradients.length;

	return colorGradientSettings;
}
