import { useCallback, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import type { Gradient } from '@wordpress/global-styles-engine';
import { useBlockEditContext } from '../block-edit';
import { useSettings } from '../use-settings';
import { store as blockEditorStore } from '../../store';
import type { UseGradientOptions } from './types';

export function __experimentalGetGradientClass(
	gradientSlug: string | undefined
): string | undefined {
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
export function getGradientValueBySlug(
	gradients: Gradient[] | undefined,
	slug: string | undefined
): string | undefined {
	const gradient = gradients?.find( ( g ) => g.slug === slug );
	return gradient && gradient.gradient;
}

export function __experimentalGetGradientObjectByGradientValue(
	gradients: Gradient[] | undefined,
	value: string | undefined
): Gradient | undefined {
	const gradient = gradients?.find( ( g ) => g.gradient === value );
	return gradient;
}

/**
 * Retrieves the gradient slug per slug.
 *
 * @param {Array}  gradients Gradient Palette
 * @param {string} value     Gradient value
 * @return {string} Gradient slug.
 */
export function getGradientSlugByValue(
	gradients: Gradient[] | undefined,
	value: string | undefined
): string | undefined {
	const gradient = __experimentalGetGradientObjectByGradientValue(
		gradients,
		value
	);
	return gradient && gradient.slug;
}

function useGradient( {
	gradientAttribute = 'gradient',
	customGradientAttribute = 'customGradient',
}: UseGradientOptions = {} ) {
	const { clientId } = useBlockEditContext();

	const [
		userGradientPalette,
		themeGradientPalette,
		defaultGradientPalette,
	] = useSettings(
		'color.gradients.custom',
		'color.gradients.theme',
		'color.gradients.default'
	);
	const allGradients = useMemo(
		// The settings list the palettes' gradients.
		() => [
			...( ( userGradientPalette as Gradient[] | undefined ) || [] ),
			...( ( themeGradientPalette as Gradient[] | undefined ) || [] ),
			...( ( defaultGradientPalette as Gradient[] | undefined ) || [] ),
		],
		[ userGradientPalette, themeGradientPalette, defaultGradientPalette ]
	);
	const { gradient, customGradient } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			// The hook is used within a block, which has a client ID.
			const attributes = getBlockAttributes( clientId! ) || {};
			return {
				// The gradient attributes hold a value and a slug.
				customGradient: attributes[ customGradientAttribute ] as
					string | undefined,
				gradient: attributes[ gradientAttribute ] as string | undefined,
			};
		},
		[ clientId, gradientAttribute, customGradientAttribute ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const setGradient = useCallback(
		( newGradientValue?: string ) => {
			const slug = getGradientSlugByValue(
				allGradients,
				newGradientValue
			);
			if ( slug ) {
				// The hook is used within a block, which has a client ID.
				updateBlockAttributes( clientId!, {
					[ gradientAttribute ]: slug,
					[ customGradientAttribute ]: undefined,
				} );
				return;
			}
			// The hook is used within a block, which has a client ID.
			updateBlockAttributes( clientId!, {
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

export { useGradient as __experimentalUseGradient };
