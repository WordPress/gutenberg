import { __EXPERIMENTAL_ELEMENTS as ELEMENTS } from '@wordpress/blocks';
import { generateGlobalStyles } from './core/render';
import type { GlobalStylesConfig } from './types';

/**
 * Generates CSS for preview contexts to display a specific state (hover, focus, etc.).
 * Takes state-specific styles and generates CSS as if they were the default styles,
 * allowing previews to show how a block or element will appear in that state.
 *
 * @param stateStyles - The styles for the specific state (e.g., hover styles)
 * @param name        - The block name (e.g., 'core/button') or element name (e.g., 'link')
 * @return CSS string for the state preview
 */
export function generatePreviewStateStyles(
	stateStyles: any,
	name: string
): string {
	if ( ! stateStyles || ! name ) {
		return '';
	}

	// Create a minimal theme.json-like config with the state styles
	// positioned as if they were the default styles for this block or element.
	// Element names have no namespace, so they never clash with a block name.
	const nodeType = Object.hasOwn( ELEMENTS, name ) ? 'elements' : 'blocks';
	const previewConfig: GlobalStylesConfig = {
		settings: {}, // Empty settings to satisfy the config structure
		styles: {
			[ nodeType ]: {
				[ name ]: stateStyles,
			},
		},
	};

	try {
		const [ generatedStyles ] = generateGlobalStyles( previewConfig, [] );

		return generatedStyles.map( ( style ) => style.css ).join( '\n' );
	} catch {
		// If generation fails, return empty string to avoid breaking previews
		return '';
	}
}
