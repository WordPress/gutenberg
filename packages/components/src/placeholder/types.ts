/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { IconType } from '../icon';

export type PlaceholderProps = {
	/**
	 * The children elements.
	 */
	children?: ReactNode;
	/**
	 * Class to set on the container div.
	 */
	className?: string;
	/**
	 * If provided, renders an icon next to the label.
	 */
	icon?: IconType;
	/**
	 * Instructions of the placeholder.
	 */
	instructions?: string;
	/**
	 * Changes placeholder children layout from flex-row to flex-column.
	 */
	isColumnLayout?: boolean;
	/**
	 * Title of the placeholder.
	 */
	label?: string;
	/**
	 * A rendered notices list
	 */
	notices?: ReactNode;
	/**
	 * Preview to be rendered in the placeholder.
	 */
	preview?: ReactNode;
	/**
	 * Outputs a placeholder illustration.
	 */
	withIllustration?: boolean;
};
