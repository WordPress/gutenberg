/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './widget-toolbar.module.css';

export interface WidgetToolbarProps {
	/** Toolbar controls, laid out in one row. */
	children: ReactNode;

	/** Variant surface class (background, reveal). */
	className?: string;
}

/**
 * Shared shell for the per-tile action toolbars. Anchors to the tile's
 * top-right corner and lays controls out in the row the header also uses, so
 * a toolbar lines up with the title when they overlap.
 *
 * @param {WidgetToolbarProps} props             Component props.
 * @param {ReactNode}          props.children    Toolbar controls.
 * @param {string}             [props.className] Variant surface class.
 * @return {React.ReactNode} The toolbar shell.
 */
export function WidgetToolbar( {
	children,
	className,
}: WidgetToolbarProps ): React.ReactNode {
	return (
		<Stack
			direction="row"
			align="center"
			gap="xs"
			className={ clsx( styles.widgetToolbar, className ) }
		>
			{ children }
		</Stack>
	);
}
