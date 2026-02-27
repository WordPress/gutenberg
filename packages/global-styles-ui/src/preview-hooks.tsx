/**
 * WordPress dependencies
 */
import type { Color } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useSetting, useStyle } from './hooks';

export function useStylesPreviewColors(): {
	paletteColors: Color[];
	highlightedColors: Color[];
} {
	const [ textColor = 'black' ] = useStyle< string >( 'color.text' );
	const [ backgroundColor = 'white' ] =
		useStyle< string >( 'color.background' );
	const [ headingColor = textColor ] = useStyle< string >(
		'elements.h1.color.text'
	);
	const [ linkColor = headingColor ] = useStyle< string >(
		'elements.link.color.text'
	);
	const [ buttonBackgroundColor = linkColor ] = useStyle< string >(
		'elements.button.color.background'
	);

	const [ coreColors ] = useSetting< Color[] >( 'color.palette.core' ) || [];
	const [ themeColors ] =
		useSetting< Color[] >( 'color.palette.theme' ) || [];
	const [ customColors ] =
		useSetting< Color[] >( 'color.palette.custom' ) || [];

	const paletteColors: Color[] = ( themeColors ?? [] )
		.concat( customColors ?? [] )
		.concat( coreColors ?? [] );

	const textColorObject = paletteColors.filter(
		( { color } ) => color === textColor
	);
	const buttonBackgroundColorObject = paletteColors.filter(
		( { color } ) => color === buttonBackgroundColor
	);

	const highlightedColors = textColorObject
		.concat( buttonBackgroundColorObject )
		.concat( paletteColors )
		.filter(
			// we exclude these background color because it is already visible in the preview.
			( { color } ) => color !== backgroundColor
		)
		.slice( 0, 2 );

	return {
		paletteColors,
		highlightedColors,
	};
}
