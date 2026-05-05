/**
 * WordPress dependencies
 */
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import StyleVariationsContainer from './style-variations-container';
import { withGlobalStylesProvider } from './with-global-styles-provider';

export interface StyleVariationsProps {
	value: GlobalStylesConfig;
	baseValue: GlobalStylesConfig;
	onChange: ( config: GlobalStylesConfig ) => void;
	gap?: number;
}

/**
 * Render Style Variations.
 *
 * @example
 * ```tsx
 * <StyleVariations
 *   value={userConfig}
 *   baseValue={baseConfig}
 *   onChange={setUserConfig}
 *   gap={3}
 * />
 * ```
 */
export const StyleVariations: React.ComponentType< StyleVariationsProps > =
	withGlobalStylesProvider( StyleVariationsContainer );
