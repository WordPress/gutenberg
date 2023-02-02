/**
 * External dependencies
 */
import { get } from 'lodash';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	getBlockType,
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
} from '@wordpress/blocks';
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../experiments';

const { useGlobalSetting } = unlock( blockEditorExperiments );

// Enable colord's a11y plugin.
extend( [ a11yPlugin ] );

const ROOT_BLOCK_SUPPORTS = [
	'background',
	'backgroundColor',
	'color',
	'linkColor',
	'buttonColor',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'textDecoration',
	'padding',
	'contentSize',
	'wideSize',
	'blockGap',
];

export function getSupportedGlobalStylesPanels( name ) {
	if ( ! name ) {
		return ROOT_BLOCK_SUPPORTS;
	}

	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return [];
	}

	const supportKeys = [];

	// Check for blockGap support.
	// Block spacing support doesn't map directly to a single style property, so needs to be handled separately.
	// Also, only allow `blockGap` support if serialization has not been skipped, to be sure global spacing can be applied.
	if (
		blockType?.supports?.spacing?.blockGap &&
		blockType?.supports?.spacing?.__experimentalSkipSerialization !==
			true &&
		! blockType?.supports?.spacing?.__experimentalSkipSerialization?.some?.(
			( spacingType ) => spacingType === 'blockGap'
		)
	) {
		supportKeys.push( 'blockGap' );
	}

	// check for shadow support
	if ( blockType?.supports?.shadow ) {
		supportKeys.push( 'shadow' );
	}

	Object.keys( STYLE_PROPERTY ).forEach( ( styleName ) => {
		if ( ! STYLE_PROPERTY[ styleName ].support ) {
			return;
		}

		// Opting out means that, for certain support keys like background color,
		// blocks have to explicitly set the support value false. If the key is
		// unset, we still enable it.
		if ( STYLE_PROPERTY[ styleName ].requiresOptOut ) {
			if (
				STYLE_PROPERTY[ styleName ].support[ 0 ] in
					blockType.supports &&
				get(
					blockType.supports,
					STYLE_PROPERTY[ styleName ].support
				) !== false
			) {
				return supportKeys.push( styleName );
			}
		}

		if (
			get(
				blockType.supports,
				STYLE_PROPERTY[ styleName ].support,
				false
			)
		) {
			return supportKeys.push( styleName );
		}
	} );

	return supportKeys;
}

export function useColorsPerOrigin( name ) {
	const [ customColors ] = useGlobalSetting( 'color.palette.custom', name );
	const [ themeColors ] = useGlobalSetting( 'color.palette.theme', name );
	const [ defaultColors ] = useGlobalSetting( 'color.palette.default', name );
	const [ shouldDisplayDefaultColors ] = useGlobalSetting(
		'color.defaultPalette'
	);

	return useMemo( () => {
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
					'Indicates this palette is created by the user.'
				),
				colors: customColors,
			} );
		}
		return result;
	}, [ customColors, themeColors, defaultColors ] );
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

	return useMemo( () => {
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
