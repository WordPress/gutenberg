/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { useSelect } from '@wordpress/data';

const {
	useGlobalSetting,
	useColorsPerOrigin: useColorsPerOriginFromSettings,
	useGradientsPerOrigin: useGradientsPerOriginFromSettings,
} = unlock( blockEditorPrivateApis );

// Enable colord's a11y plugin.
extend( [ a11yPlugin ] );

export function useColorsPerOrigin( name ) {
	const [ customColors ] = useGlobalSetting( 'color.palette.custom', name );
	const [ themeColors ] = useGlobalSetting( 'color.palette.theme', name );
	const [ defaultColors ] = useGlobalSetting( 'color.palette.default', name );
	const [ shouldDisplayDefaultColors ] = useGlobalSetting(
		'color.defaultPalette'
	);

	return useColorsPerOriginFromSettings( {
		color: {
			palette: {
				custom: customColors,
				theme: themeColors,
				default: defaultColors,
			},
			defaultPalette: shouldDisplayDefaultColors,
		},
	} );
}

export function useGradientsPerOrigin( name ) {
	const [ customGradients ] = useGlobalSetting(
		'color.gradients.custom',
		name
	);
	const [ themeGradients ] = useGlobalSetting(
		'color.gradients.theme',
		name
	);
	const [ defaultGradients ] = useGlobalSetting(
		'color.gradients.default',
		name
	);
	const [ shouldDisplayDefaultGradients ] = useGlobalSetting(
		'color.defaultGradients'
	);

	return useGradientsPerOriginFromSettings( {
		color: {
			gradients: {
				custom: customGradients,
				theme: themeGradients,
				default: defaultGradients,
			},
			defaultGradients: shouldDisplayDefaultGradients,
		},
	} );
}

export function useColorRandomizer( name ) {
	const [ themeColors, setThemeColors ] = useGlobalSetting(
		'color.palette.theme',
		name
	);

	function randomizeColors() {
		/* eslint-disable no-restricted-syntax */
		const randomRotationValue = Math.floor( Math.random() * 225 );
		/* eslint-enable no-restricted-syntax */

		const newColors = themeColors.map( ( colorObject ) => {
			const { color } = colorObject;
			const newColor = colord( color )
				.rotate( randomRotationValue )
				.toHex();

			return {
				...colorObject,
				color: newColor,
			};
		} );

		setThemeColors( newColors );
	}

	return window.__experimentalEnableColorRandomizer
		? [ randomizeColors ]
		: [];
}

export function useSupportedStyles( name, element ) {
	const { supportedPanels } = useSelect(
		( select ) => {
			return {
				supportedPanels: unlock(
					select( blocksStore )
				).getSupportedStyles( name, element ),
			};
		},
		[ name, element ]
	);

	return supportedPanels;
}
