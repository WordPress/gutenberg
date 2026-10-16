import type { ReactNode, Ref } from 'react';
import type { Block } from '@wordpress/blocks';
import type { EditorStylesStyle } from '../editor-styles/types';

export interface BlockPreviewProps {
	/** A block instance (object) or an array of blocks to be previewed. */
	blocks?: Block | Block[];
	/**
	 * Width of the preview container in pixels. Controls at what size the
	 * blocks will be rendered inside the preview.
	 */
	viewportWidth?: number;
	/** Minimum height of the preview iframe. */
	minHeight?: number;
	/** Styles added to the preview iframe. */
	additionalStyles?: EditorStylesStyle[];
	/** @deprecated Use `minHeight` instead. */
	__experimentalMinHeight?: number;
	/** @deprecated Use `additionalStyles` instead. */
	__experimentalPadding?: number;
}

export interface AutoBlockPreviewProps {
	/** Width the blocks render at, defaulting to the container width. */
	viewportWidth?: number;
	/** Minimum height of the preview iframe. */
	minHeight?: number;
	/** Styles added to the preview iframe. */
	additionalStyles?: EditorStylesStyle[];
}

export interface ScaledBlockPreviewProps extends AutoBlockPreviewProps {
	/** Width of the preview container. */
	containerWidth: number;
}

export interface UseBlockPreviewOptions {
	/** Block objects. */
	blocks: Block | Block[];
	/**
	 * Optional. Props to pass to the element. Must contain the ref if one is
	 * defined.
	 */
	props?: { ref?: Ref< HTMLElement >; className?: string } & Record<
		string,
		unknown
	>;
	/** Layout settings to be used in the preview. */
	layout?: Record< string, unknown >;
}

export interface AsyncProps {
	/** Rendered once the preview queue gets to it. */
	children: ReactNode;
	/** Rendered until then. */
	placeholder?: ReactNode;
}
