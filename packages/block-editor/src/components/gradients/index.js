/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';

export function __experimentalGetGradientClass( gradientSlug ) {
	if ( ! gradientSlug ) {
		return undefined;
	}
	return `has-${ gradientSlug }-gradient-background`;
}

function getGradientValueBySlug( gradients, slug ) {
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

function getGradientSlugByValue( gradients, value ) {
	const gradient = __experimentalGetGradientObjectByGradientValue(
		gradients,
		value
	);
	return gradient && gradient.slug;
}

export function __experimentalUseGradient(
	{
		gradientAttribute = 'gradient',
		customGradientAttribute = 'customGradient',
	} = {},
	customClientId
) {
	const { clientId } = useBlockEditContext();
	const id = clientId || customClientId;

	const { gradients, gradient, customGradient } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } = select(
				'core/block-editor'
			);
			const attributes = getBlockAttributes( id );
			return {
				gradient: attributes[ gradientAttribute ],
				customGradient: attributes[ customGradientAttribute ],
				gradients: getSettings().gradients,
			};
		},
		[ id, gradientAttribute, customGradientAttribute ]
	);

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const setGradient = useCallback(
		( newGradientValue ) => {
			const slug = getGradientSlugByValue( gradients, newGradientValue );
			if ( slug ) {
				updateBlockAttributes( id, {
					[ gradientAttribute ]: slug,
					[ customGradientAttribute ]: undefined,
				} );
				return;
			}
			updateBlockAttributes( id, {
				[ gradientAttribute ]: undefined,
				[ customGradientAttribute ]: newGradientValue,
			} );
		},
		[ gradients, id, updateBlockAttributes ]
	);

	const gradientClass = __experimentalGetGradientClass( gradient );
	let gradientValue;
	if ( gradient ) {
		gradientValue = getGradientValueBySlug( gradients, gradient );
	} else {
		gradientValue = customGradient;
	}
	return { gradientClass, gradientValue, setGradient };
}
