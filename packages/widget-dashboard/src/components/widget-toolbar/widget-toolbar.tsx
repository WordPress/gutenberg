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
import { useReserveHeaderPadding } from '../widget-header/widget-header-fit';
import styles from './widget-toolbar.module.css';

export interface WidgetToolbarProps {
	/**
	 * The active mode's controls.
	 */
	children: ReactNode;

	/**
	 * Lift the toolbar with a shadow while customizing.
	 */
	editMode?: boolean;
}

/**
 * The per-tile toolbar chip holding the active mode's controls.
 * Always visible; lifted with a shadow only while customizing.
 *
 * @param {WidgetToolbarProps} props Component props.
 */
export function WidgetToolbar( {
	children,
	editMode = false,
}: WidgetToolbarProps ): React.ReactNode {
	const paddingReserveRef =
		useReserveHeaderPadding< HTMLDivElement >( 'chip' );

	return (
		<Stack
			ref={ paddingReserveRef }
			direction="row"
			align="center"
			gap="xs"
			className={ clsx(
				styles[ 'widget-toolbar' ],
				editMode && styles.elevated
			) }
		>
			{ children }
		</Stack>
	);
}
