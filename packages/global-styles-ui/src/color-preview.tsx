/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { getStyle } from '@wordpress/global-styles-engine';
import type { Color } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { GlobalStylesContext } from './context';

export function ColorPreview() {
	const { merged } = useContext( GlobalStylesContext );

	// Extract main colors from the global styles
	const backgroundColor = getStyle( merged, 'color.background' ) || '#ffffff';
	const textColor = getStyle( merged, 'color.text' ) || '#000000';

	// Get color palette - handle both array and object formats
	const palette = merged?.settings?.color?.palette;
	let paletteColors: Color[] = [];

	if ( Array.isArray( palette ) ) {
		paletteColors = palette;
	} else if ( palette && typeof palette === 'object' ) {
		paletteColors = palette.theme || palette.custom || [];
	}

	// Get first few colors from palette for preview
	const previewColors = paletteColors.slice( 0, 4 );

	return (
		<HStack
			spacing={ 0 }
			justify="center"
			style={ {
				height: '100%',
				overflow: 'hidden',
				minHeight: '40px',
			} }
		>
			{ /* Background color swatch */ }
			<div
				style={ {
					backgroundColor,
					width: '25%',
					height: '100%',
					minHeight: '40px',
				} }
			/>
			{ /* Text color swatch */ }
			<div
				style={ {
					backgroundColor: textColor,
					width: '25%',
					height: '100%',
					minHeight: '40px',
				} }
			/>
			{ /* Palette colors */ }
			{ previewColors
				.slice( 0, 2 )
				.map( ( color: Color, index: number ) => (
					<div
						key={ index }
						style={ {
							backgroundColor: color.color,
							width: '25%',
							height: '100%',
							minHeight: '40px',
						} }
					/>
				) ) }
		</HStack>
	);
}
