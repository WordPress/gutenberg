/**
 * WordPress dependencies
 */
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import ColorVariationsInternal from './variations/variations-color';
import { withGlobalStylesProvider } from './with-global-styles-provider';

export interface ColorVariationsProps {
	value: GlobalStylesConfig;
	baseValue: GlobalStylesConfig;
	onChange: ( config: GlobalStylesConfig ) => void;
	title?: string;
	gap?: number;
}

/**
 * Render Global Styles Color Variations.
 *
 * @example
 * ```tsx
 * <ColorVariations
 *   value={userConfig}
 *   baseValue={baseConfig}
 *   onChange={setUserConfig}
 *   title="Palettes"
 *   gap={3}
 * />
 * ```
 */
export const ColorVariations: React.ComponentType< ColorVariationsProps > =
	withGlobalStylesProvider( ColorVariationsInternal );
