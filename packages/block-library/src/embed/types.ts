import type { FormEvent } from 'react';
import type {
	BlockEditProps,
	BlockTypeIcon,
	BlockVariation,
} from '@wordpress/blocks';

/**
 * Attributes of the embed block.
 */
export interface EmbedAttributes extends Record< string, unknown > {
	url?: string;
	caption?: string;
	type?: string;
	providerNameSlug?: string;
	allowResponsive?: boolean;
	responsive?: boolean;
	previewable?: boolean;
	className?: string;
}

/**
 * An embed provider variation, which also declares the URL patterns it
 * matches and may use an icon with colors.
 */
export interface EmbedVariation extends Omit<
	BlockVariation< EmbedAttributes >,
	'icon'
> {
	/**
	 * An icon helping to visualize the variation.
	 */
	icon?: BlockTypeIcon;
	/**
	 * The regular expressions matching the URLs the variation embeds.
	 */
	patterns?: RegExp[];
}

/**
 * An embed preview, as returned by the oEmbed proxy endpoint.
 */
export interface EmbedPreviewData {
	html?: string;
	type?: string;
	provider_name?: string;
	scripts?: string[];
	url?: string;
	thumbnail_url?: string;
	title?: string;
}

/**
 * Block props `createUpgradedEmbedBlock` reads, with the embed preview.
 */
export interface UpgradeableEmbedProps extends Partial<
	BlockEditProps< EmbedAttributes >
> {
	preview?: EmbedPreviewData;
}

/**
 * Props of the embed block's edit component.
 */
export type EmbedEditProps = BlockEditProps< EmbedAttributes >;

/**
 * Props for `EmbedControls`.
 */
export interface EmbedControlsProps {
	blockSupportsResponsive?: boolean;
	showEditButton?: boolean;
	themeSupportsResponsive?: boolean;
	allowResponsive?: boolean;
	toggleResponsive: ( newAllowResponsive: boolean ) => void;
	switchBackToURLInput: () => void;
}

/**
 * Props for `EmbedPlaceholder`.
 */
export interface EmbedPlaceholderProps {
	icon?: BlockTypeIcon;
	label: string;
	value?: string;
	onSubmit: ( event?: FormEvent< HTMLFormElement > ) => void;
	onChange: ( value?: string ) => void;
	cannotEmbed?: boolean;
	fallback?: () => void;
	tryAgain: () => void;
}

/**
 * Props for `EmbedPreview`.
 */
export interface EmbedPreviewProps {
	preview: EmbedPreviewData;
	previewable?: boolean;
	url?: string;
	type?: string;
	isSelected?: boolean;
	className?: string;
	icon?: BlockTypeIcon;
	label: string;
}

/**
 * Props for `WpEmbedPreview`.
 */
export interface WpEmbedPreviewProps {
	html?: string;
}

/**
 * A message the WordPress embed template posts to resize its iframe.
 */
export interface WpEmbedMessage {
	secret?: string;
	message?: string;
	value?: number;
}
