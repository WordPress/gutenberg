/**
 * WordPress dependencies
 */
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import TypographyVariationsInternal from './variations/variations-typography';
import { withGlobalStylesProvider } from './with-global-styles-provider';

export interface TypographyVariationsProps {
	value: GlobalStylesConfig;
	baseValue: GlobalStylesConfig;
	onChange: ( config: GlobalStylesConfig ) => void;
	title?: string;
	gap?: number;
}

/**
 * Render Typography Variations.
 *
 * @example
 * ```tsx
 * <TypographyVariations
 *   value={userConfig}
 *   baseValue={baseConfig}
 *   onChange={setUserConfig}
 *   title="Typography"
 *   gap={3}
 * />
 * ```
 */
export const TypographyVariations: React.ComponentType< TypographyVariationsProps > =
	withGlobalStylesProvider( TypographyVariationsInternal );
