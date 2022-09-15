/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';
import useSetting from '../use-setting';
import { store as blockEditorStore } from '../../store';

export function __experimentalGetGradientClass( gradientSlug ) {
	if ( ! gradientSlug ) {
		return undefined;
	}
	return `has-${ gradientSlug }-gradient-background`;
}

/**
 * Retrieves the gradient value per slug.
 *
 * @param {Array}  gradients Gradient Palette
 * @param {string} slug      Gradient slug
 *
 * @return {string} Gradient value.
 */
export function getGradientValueBySlug( gradients, slug ) {
	const gradient = find( gradients, [ 'slug', slug ] );
	return gradient && gradient.gradient;
}

export function __experimentalGetGradientObjectByGradientValue(
	gradients,
	value
) {
	const gradient = find( gradients, [ 'gradient', value ] );
	return gradient;
}

/**
 * Retrieves the gradient slug per slug.
 *
 * @param {Array}  gradients Gradient Palette
 * @param {string} value     Gradient value
 * @return {string} Gradient slug.
 */
export function getGradientSlugByValue( gradients, value ) {
	const gradient = __experimentalGetGradientObjectByGradientValue(
		gradients,
		value
	);
	return gradient && gradient.slug;
}

export function __experimentalUseGradient( {
	gradientAttribute = 'gradient',
	customGradientAttribute = 'customGradient',
} = {} ) {
	const { clientId } = useBlockEditContext();

	const userGradientPalette = useSetting( 'color.gradients.custom' );
	const themeGradientPalette = useSetting( 'color.gradients.theme' );
	const defaultGradientPalette = useSetting( 'color.gradients.default' );
	const allGradients = useMemo(
		() => [
			...( userGradientPalette || [] ),
			...( themeGradientPalette || [] ),
			...( defaultGradientPalette || [] ),
		],
		[ userGradientPalette, themeGradientPalette, defaultGradientPalette ]
	);
	const { gradient, customGradient } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			const attributes = getBlockAttributes( clientId ) || {};
			return {
				customGradient: attributes[ customGradientAttribute ],
				gradient: attributes[ gradientAttribute ],
			};
		},
		[ clientId, gradientAttribute, customGradientAttribute ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const setGradient = useCallback(
		( newGradientValue ) => {
			const slug = getGradientSlugByValue(
				allGradients,
				newGradientValue
			);
			if ( slug ) {
				updateBlockAttributes( clientId, {
					[ gradientAttribute ]: slug,
					[ customGradientAttribute ]: undefined,
				} );
				return;
			}
			updateBlockAttributes( clientId, {
				[ gradientAttribute ]: undefined,
				[ customGradientAttribute ]: newGradientValue,
			} );
		},
		[ allGradients, clientId, updateBlockAttributes ]
	);

	const gradientClass = __experimentalGetGradientClass( gradient );
	let gradientValue;
	if ( gradient ) {
		gradientValue = getGradientValueBySlug( allGradients, gradient );
	} else {
		gradientValue = customGradient;
	}
	return { gradientClass, gradientValue, setGradient };
}
