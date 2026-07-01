/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { home } from '@wordpress/icons';
import { EmptyState, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import styles from './no-widgets-state.module.css';

export interface NoWidgetsStateProps {
	children?: ReactNode;
}

/**
 * Empty-state placeholder shown while the dashboard `layout` has no widgets.
 * Pair it with `WidgetDashboard.Widgets` so it stands in for the grid until
 * widgets are added. Falls back to a built-in placeholder; pass `children` to
 * override.
 *
 * @param {NoWidgetsStateProps} props Component props.
 */
export function NoWidgetsState( {
	children,
}: NoWidgetsStateProps ): React.ReactNode {
	const { layout } = useDashboardInternalContext();
	if ( layout.length > 0 ) {
		return null;
	}

	return (
		<Stack justify="center" align="center" className={ styles.root }>
			{ children ?? (
				<EmptyState.Root>
					<EmptyState.Icon icon={ home } />
					<EmptyState.Title>
						{ __( 'Your dashboard is empty' ) }
					</EmptyState.Title>
					<EmptyState.Description>
						{ __(
							'Add widgets to start customizing your dashboard.'
						) }
					</EmptyState.Description>
				</EmptyState.Root>
			) }
		</Stack>
	);
}
