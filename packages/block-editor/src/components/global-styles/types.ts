import type { ComponentProps } from 'react';
import type { Dropdown } from '@wordpress/components';
import type { Color, Gradient } from '@wordpress/global-styles-engine';

export type ToolsPanelPopoverProps = Pick<
	NonNullable< ComponentProps< typeof Dropdown >[ 'popoverProps' ] >,
	'placement' | 'offset' | 'shift'
>;

/**
 * Presets of one kind, split by the origin that defines them.
 */
export interface PresetsPerOrigin< T > {
	custom?: T[];
	theme?: T[];
	default?: T[];
}

/**
 * The empty array that clears a preset list when the block cannot use it.
 */
export type NoPresets = never[] &
	Partial< Record< keyof PresetsPerOrigin< never >, undefined > >;

/**
 * Theme.json settings for a block or element, as the style panels read them.
 * A section or feature is `false` when the block does not support it.
 */
export interface StyleSettings {
	background?: Record< string, unknown >;
	border?: Record< string, unknown >;
	color?: Record< string, unknown > & {
		palette?: PresetsPerOrigin< Color >;
		gradients?: PresetsPerOrigin< Gradient > | NoPresets;
		custom?: boolean;
		customGradient?: boolean;
		defaultPalette?: boolean;
		defaultGradients?: boolean;
	};
	dimensions?: Record< string, unknown >;
	layout?: Record< string, unknown >;
	parentLayout?: unknown;
	shadow?: unknown;
	spacing?: Record< string, unknown >;
	typography?: Record< string, unknown >;
}
