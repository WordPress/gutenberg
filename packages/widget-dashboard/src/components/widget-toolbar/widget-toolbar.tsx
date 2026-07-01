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
	/**
	 * The active mode's controls.
	 */
	children: ReactNode;

	/**
	 * Subtle hover-revealed surface (normal) vs solid always-visible (customize).
	 */
	revealOnHover?: boolean;
}

/**
 * The per-tile toolbar chip holding the active mode's controls. Solid and always
 * visible while customizing; subtle and revealed on hover in normal mode.
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
