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
	/** The active mode's controls. */
	children: ReactNode;

	/**
	 * Use the subtle surface revealed on tile hover/focus (normal mode).
	 * Defaults to the solid surface that stays visible (customize mode).
	 */
	revealOnHover?: boolean;
}

/**
 * The single per-tile toolbar: a chip that holds the active mode's controls
 * (layout while customizing, the settings gear otherwise). The `WidgetHeader`
 * overlay positions it on the tile; this provides the chip surface and the
 * controls row. The solid surface stays visible through a customize session;
 * the subtle surface is revealed on tile hover, the way the gear behaves in
 * normal mode.
 *
 * @param {WidgetToolbarProps} props Component props.
 */
export function WidgetToolbar( {
	children,
	revealOnHover = false,
}: WidgetToolbarProps ): React.ReactNode {
	return (
		<Stack
			direction="row"
			align="center"
			gap="xs"
			className={ clsx(
				styles.widgetToolbar,
				revealOnHover ? styles.subtle : styles.solid
			) }
		>
			{ children }
		</Stack>
	);
}
