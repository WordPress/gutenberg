/**
 * Internal dependencies
 */
import { generateGlobalStyles } from './core/render';
import type { GlobalStylesConfig } from './types';

/**
 * Generates CSS for preview contexts to display a specific state (hover, focus, etc.).
 * Takes state-specific styles and generates CSS as if they were the default styles,
 * allowing previews to show how a block will appear in that state.
 *
 * @param stateStyles - The styles for the specific state (e.g., hover styles)
 * @param blockName   - The block name (e.g., 'core/button')
 * @return CSS string for the state preview
 */
export function generatePreviewStateStyles(
	stateStyles: any,
	blockName: string
): string {
	if ( ! stateStyles || ! blockName ) {
		return '';
	}

	// Create a minimal theme.json-like config with the state styles
	// positioned as if they were the default styles for this block
	const previewConfig: GlobalStylesConfig = {
		settings: {}, // Empty settings to satisfy the config structure
		styles: {
			blocks: {
				[ blockName ]: stateStyles,
			},
		},
	};

	try {
		const [ generatedStyles ] = generateGlobalStyles( previewConfig, [] );

		return generatedStyles.map( ( style ) => style.css ).join( '\n' );
	} catch ( error ) {
		// If generation fails, return empty string to avoid breaking previews
		return '';
	}
}
