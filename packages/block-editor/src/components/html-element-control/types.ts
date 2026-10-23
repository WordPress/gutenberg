import type { ComponentProps } from 'react';
import type { SelectControl } from '@wordpress/ui';

/**
 * An option of the HTML element select.
 */
export type HTMLElementOption = NonNullable<
	ComponentProps< typeof SelectControl >[ 'items' ]
>[ number ];

/**
 * Props of `HTMLElementControl`.
 */
export interface HTMLElementControlProps {
	/**
	 * The current HTML tag name.
	 */
	tagName: string;
	/**
	 * Function to call when the tag is changed.
	 */
	onChange: ( tagName: string ) => void;
	/**
	 * The client ID of the block. Used to check for existing <main> elements.
	 */
	clientId?: string;
	/**
	 * SelectControl options.
	 */
	options?: HTMLElementOption[];
}
