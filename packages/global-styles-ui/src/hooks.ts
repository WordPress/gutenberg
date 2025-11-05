/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { useCallback, useContext, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import {
	getStyle,
	setStyle,
	getSetting,
	setSetting,
	mergeGlobalStyles,
} from '@wordpress/global-styles-engine';
import type { StyleVariation, Color } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { GlobalStylesContext } from './context';
import { removePropertiesFromObject, isVariationWithProperties } from './utils';

// Enable colord's a11y plugin.
extend( [ a11yPlugin ] );

/**
 * Hook to get and set style values with memoization.
 *
 * @param path               The path to the style value.
 * @param blockName          The name of the block, if applicable.
 * @param readFrom           Which source to read from: "base" (theme), "user" (customizations), or "merged" (final result).
 * @param shouldDecodeEncode Whether to decode and encode the style value.
 * @return An array containing the style value and a function to set the style
 * value.
 *
 * @example
 * const [ color, setColor ] = useStyle<string>( 'color.text', 'core/button', 'merged' );
 */
export function useStyle< T = any >(
	path: string,
	blockName?: string,
	readFrom: 'base' | 'user' | 'merged' = 'merged',
	shouldDecodeEncode: boolean = true
) {
	const { user, base, merged, onChange } = useContext( GlobalStylesContext );

	let sourceValue = merged;
	if ( readFrom === 'base' ) {
		sourceValue = base;
	} else if ( readFrom === 'user' ) {
		sourceValue = user;
	}

	const styleValue = useMemo(
		() => getStyle< T >( sourceValue, path, blockName, shouldDecodeEncode ),
		[ sourceValue, path, blockName, shouldDecodeEncode ]
	);

	const setStyleValue = useCallback(
		( newValue: T | undefined ) => {
			const newGlobalStyles = setStyle< T >(
				user,
				path,
				newValue,
				blockName
			);
			onChange( newGlobalStyles );
		},
		[ user, onChange, path, blockName ]
	);

	return [ styleValue, setStyleValue ] as const;
}

/**
 * Hook to get and set setting values with memoization.
 *
 * @param path      The path to the setting value.
 * @param blockName The name of the block, if applicable.
 * @param readFrom  Which source to read from: "base" (theme), "user" (customizations), or "merged" (final result).
 * @return An array containing the setting value and a function to set the
 * setting value.
 *
 * @example
 * const [ fontSize, setFontSize ] = useSetting<string>( 'fontSize', 'core/button', 'merged' );
 */
export function useSetting< T = any >(
	path: string,
	blockName?: string,
	readFrom: 'base' | 'user' | 'merged' = 'merged'
) {
	const { user, base, merged, onChange } = useContext( GlobalStylesContext );

	let sourceValue = merged;
	if ( readFrom === 'base' ) {
		sourceValue = base;
	} else if ( readFrom === 'user' ) {
		sourceValue = user;
	}
	const settingValue = useMemo(
		() => getSetting< T >( sourceValue, path, blockName ),
		[ sourceValue, path, blockName ]
	);

	const setSettingValue = useCallback(
		( newValue: T | undefined ) => {
			const newGlobalStyles = setSetting< T >(
				user,
				path,
				newValue,
				blockName
			);
			onChange( newGlobalStyles );
		},
		[ user, onChange, path, blockName ]
	);

	return [ settingValue, setSettingValue ] as const;
}

const EMPTY_ARRAY: StyleVariation[] = [];

/**
 * Checks whether a style variation is empty.
 * @param root0
 * @param root0.title
 * @param root0.settings
 * @param root0.styles
 */
function hasThemeVariation( {
	title,
	settings,
	styles,
}: StyleVariation ): boolean {
	return (
		title === __( 'Default' ) ||
		Object.keys( settings || {} ).length > 0 ||
		Object.keys( styles || {} ).length > 0
	);
}

/**
 * Fetches the current theme style variations that contain only the specified properties
 * and merges them with the user config.
 * @param properties
 */
export function useCurrentMergeThemeStyleVariationsWithUserConfig(
	properties: string[] = []
): StyleVariation[] {
	const { variationsFromTheme } = useSelect( ( select ) => {
		const _variationsFromTheme =
			select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations?.();

		return {
			variationsFromTheme: _variationsFromTheme || EMPTY_ARRAY,
		};
	}, [] );

	const { user: userVariation } = useContext( GlobalStylesContext );

	return useMemo( () => {
		// Create default variation from base, not user - this fixes the "Default adapts" issue
		const clonedUserVariation = structuredClone( userVariation );
		// Get user variation and remove the settings for the given property.
		const userVariationWithoutProperties = removePropertiesFromObject(
			clonedUserVariation,
			properties
		);
		userVariationWithoutProperties.title = __( 'Default' );

		const variationsWithPropertiesAndBase = (
			variationsFromTheme as StyleVariation[]
		 )
			.filter( ( variation: StyleVariation ) => {
				return isVariationWithProperties( variation, properties );
			} )
			.map( ( variation: StyleVariation ) => {
				return mergeGlobalStyles(
					userVariationWithoutProperties,
					variation
				);
			} );

		const variationsByProperties = [
			userVariationWithoutProperties,
			...variationsWithPropertiesAndBase,
		];

		return variationsByProperties?.length
			? variationsByProperties.filter( hasThemeVariation )
			: [];
	}, [ properties, userVariation, variationsFromTheme ] );
}

const propertiesToFilter = [ 'color' ];

/**
 * Hook to get color variations using the full Gutenberg implementation.
 */
export function useColorVariations(): StyleVariation[] {
	return useCurrentMergeThemeStyleVariationsWithUserConfig(
		propertiesToFilter
	);
}

/**
 * Hook to randomize theme colors using color rotation.
 *
 * @param blockName The name of the block, if applicable.
 * @return Array containing the randomize function if feature is enabled, empty array otherwise.
 */
export function useColorRandomizer( blockName?: string ): [ () => void ] | [] {
	const [ themeColors, setThemeColors ] = useSetting< Color[] >(
		'color.palette.theme',
		blockName
	);

	const randomizeColors = useCallback( () => {
		if ( ! themeColors || ! themeColors.length ) {
			return;
		}

		const randomRotationValue = Math.floor( Math.random() * 225 );

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
	}, [ themeColors, setThemeColors ] );

	return ( window as any ).__experimentalEnableColorRandomizer
		? [ randomizeColors ]
		: [];
}
