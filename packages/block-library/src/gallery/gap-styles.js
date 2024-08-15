/**
 * WordPress dependencies
 */
import {
	__experimentalGetGapCSSValue as getGapCSSValue,
	useStyleOverride,
} from '@wordpress/block-editor';

export default function GapStyles( { blockGap, clientId } ) {
	// --gallery-block--gutter-size is deprecated. --wp--style--gallery-gap-default should be used by themes that want to set a default
	// gap on the gallery.
	const fallbackValue = `var( --wp--style--gallery-gap-default, var( --gallery-block--gutter-size, var( --wp--style--block-gap, 0.5em ) ) )`;
	let gapValue = fallbackValue;
	let column = fallbackValue;
	let row;

	// Check for the possibility of split block gap values. See: https://github.com/WordPress/gutenberg/pull/37736
	if ( !! blockGap ) {
		row =
			typeof blockGap === 'string'
				? getGapCSSValue( blockGap )
				: getGapCSSValue( blockGap?.top ) || fallbackValue;
		column =
			typeof blockGap === 'string'
				? getGapCSSValue( blockGap )
				: getGapCSSValue( blockGap?.left ) || fallbackValue;
		gapValue = row === column ? row : `${ row } ${ column }`;
	}

	// The unstable gallery gap calculation requires a real value (such as `0px`) and not `0`.
	const gap = `#block-${ clientId } {
		--wp--style--unstable-gallery-gap: ${ column === '0' ? '0px' : column };
		gap: ${ gapValue }
	}`;

	useStyleOverride( { css: gap } );

	return null;
}
