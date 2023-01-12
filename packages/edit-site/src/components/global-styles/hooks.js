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
import { useGlobalStylesSetting as useSetting } from '@wordpress/block-editor';

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
	const [ customColors ] = useSetting( 'color.palette.custom', name );
	const [ themeColors ] = useSetting( 'color.palette.theme', name );
	const [ defaultColors ] = useSetting( 'color.palette.default', name );
	const [ shouldDisplayDefaultColors ] = useSetting( 'color.defaultPalette' );

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
	const [ customGradients ] = useSetting( 'color.gradients.custom', name );
	const [ themeGradients ] = useSetting( 'color.gradients.theme', name );
	const [ defaultGradients ] = useSetting( 'color.gradients.default', name );
	const [ shouldDisplayDefaultGradients ] = useSetting(
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
	const [ themeColors, setThemeColors ] = useSetting(
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
