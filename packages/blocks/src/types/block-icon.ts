/**
 * Block Icon Interfaces
 *
 * @module BlockIcon
 */

/**
 * External dependencies
 */
import type { Component } from 'react';

/**
 * Internal dependencies
 */
import type { BlockType } from './block-type';

/**
 * An icon type definition. One of a Dashicon slug, an element,
 * or a component.
 *
 * @see {@link https://developer.wordpress.org/resource/dashicons/ Dashicons} on developer.wordpress.org
 * @public
 */
export type BlockIconRenderer = string | JSX.Element | Component;

/**
 * Describes a normalized block type icon.
 *
 * @see {@link BlockType.icon}
 * @public
 */
export interface BlockIconNormalized {
	/**
	 * Render behavior of the icon, one of a Dashicon slug, an element, or a component.
	 */
	src: BlockIconRenderer;

	/**
	 * Optimal background hex string color when displaying icon.
	 */
	background?: string;

	/**
	 * Optimal foreground hex string color when displaying icon.
	 */
	foreground?: string;

	/**
	 * Optimal shadow hex string color when displaying icon.
	 */
	shadowColor?: string;
}

/**
 * Type for rendering the icon of a {@link BlockType} in an editor interface,
 * either a Dashicon slug, an element, a component, or an object describing
 * the icon.
 *
 * @public
 */
export type BlockIcon = BlockIconRenderer | BlockIconNormalized;
