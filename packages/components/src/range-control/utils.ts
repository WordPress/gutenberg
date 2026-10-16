import type { CSSProperties } from 'react';
import { useCallback } from '@wordpress/element';
import { useControlledState } from '../utils/hooks';
import { clamp } from '../utils/math';
import type { UseControlledRangeValueArgs } from './types';

/**
 * A float supported clamp function for a specific value.
 *
 * @param value The value to clamp.
 * @param min   The minimum value.
 * @param max   The maximum value.
 *
 * @return A (float) number
 */
export function floatClamp( value: number | null, min: number, max: number ) {
	if ( typeof value !== 'number' ) {
		return null;
	}

	return parseFloat( `${ clamp( value, min, max ) }` );
}

/**
 * Hook to store a clamped value, derived from props.
 *
 * @param settings
 * @return The controlled value and the value setter.
 */
export function useControlledRangeValue(
	settings: UseControlledRangeValueArgs
) {
	const { min, max, value: valueProp, initial } = settings;
	const [ state, setInternalState ] = useControlledState(
		floatClamp( valueProp, min, max ),
		{
			initial: floatClamp( initial ?? null, min, max ),
			fallback: null,
		}
	);

	const setState = useCallback(
		( nextValue: number | null ) => {
			if ( nextValue === null ) {
				setInternalState( null );
			} else {
				setInternalState( floatClamp( nextValue, min, max ) );
			}
		},
		[ min, max, setInternalState ]
	);

	// `state` can't be an empty string because we specified a fallback value of
	// `null` in `useControlledState`
	return [ state as Exclude< typeof state, '' >, setState ] as const;
}

const CSS_WIDE_KEYWORDS = new Set( [
	'inherit',
	'initial',
	'unset',
	'revert',
	'revert-layer',
] );

/**
 * Resolve CSS-wide keyword spellings for the private color classes without
 * changing the original color value passed to the stylesheet.
 *
 * @param value The CSS color value.
 */
export function getCSSWideKeyword( value: CSSProperties[ 'color' ] ) {
	if ( typeof value !== 'string' ) {
		return undefined;
	}

	const keyword = value
		.replace(
			/\\([a-f\d]{1,6})[ \t\n\r\f]?|\\([^\n\r\f])|\/\*[\s\S]*?\*\//gi,
			(
				_match,
				hex: string | undefined,
				character: string | undefined
			) => {
				if ( hex ) {
					const codePoint = parseInt( hex, 16 );
					return String.fromCodePoint(
						codePoint > 0 && codePoint <= 0x10ffff
							? codePoint
							: 0xfffd
					);
				}
				return character ?? ''; // Emotion removed comments before parsing values.
			}
		)
		.replace( /^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, '' )
		.toLowerCase();

	return CSS_WIDE_KEYWORDS.has( keyword ) ? keyword : undefined;
}
