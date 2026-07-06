/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { ActionsMenu } from '../actions-menu';
import type { ActionsMenuItem } from '../actions-menu';
import {
	AddWidget,
	Cancel,
	Divider,
	Done,
	LayoutSettings,
} from './actions-triggers';
import styles from './actions.module.css';

export interface ActionsProps {
	/**
	 * Composition slot for the customize-mode toolbar. Defaults to
	 * `AddWidget`, `LayoutSettings`, `Divider`, `Cancel`, `Done`.
	 */
	children?: ReactNode;
}

/**
 * Edit-mode toggle: a Customize button while `editMode` is off, the
 * customize toolbar while it is on, and an overflow menu. `children`
 * recompose the toolbar from the `Actions.*` triggers; the Customize button
 * and the menu render either way. Triggers read the dashboard contexts and
 * also work outside `Actions`, anywhere in the `WidgetDashboard` subtree.
 *
 * Returns `null` without `onEditChange`, so hosts without edit mode can
 * keep `Actions` mounted unconditionally.
 */
export const Actions = Object.assign(
	function Actions( { children }: ActionsProps ): React.ReactNode {
		const { editMode, onEditChange, onLayoutReset } =
			useDashboardInternalContext();

		const [ isEditActionsMounted, setIsEditActionsMounted ] =
			useState( editMode );
		const [ isExitingEditActions, setIsExitingEditActions ] =
			useState( false );

		useEffect( () => {
			if ( editMode ) {
				setIsEditActionsMounted( true );
				setIsExitingEditActions( false );
				return;
			}

			if ( ! isEditActionsMounted ) {
				return;
			}

			setIsExitingEditActions( true );
			const exitTimeout = setTimeout( () => {
				setIsEditActionsMounted( false );
				setIsExitingEditActions( false );
			}, 220 );

			return () => clearTimeout( exitTimeout );
		}, [ editMode, isEditActionsMounted ] );

		const { setResetDialogOpen } = useDashboardUIContext();

		const handleEditMode = useCallback( () => {
			onEditChange?.( ! editMode );
		}, [ editMode, onEditChange ] );

		const menuItems: ActionsMenuItem[] = [
			{
				label: __( 'Reset to default' ),
				onClick: () => setResetDialogOpen( true ),
				disabled: ! onLayoutReset,
			},
		];

		if ( ! onEditChange ) {
			return null;
		}

		return (
			<Stack direction="row" gap="sm">
				{ isEditActionsMounted ? (
					<Stack
						direction="row"
						gap="sm"
						className={
							isExitingEditActions
								? styles.editActionsExit
								: styles.editActionsEnter
						}
					>
						{ children ?? (
							<>
								<AddWidget />
								<LayoutSettings />
								<Divider />
								<Cancel />
								<Done />
							</>
						) }
					</Stack>
				) : (
					<Button
						variant="minimal"
						tone="brand"
						size="compact"
						onClick={ handleEditMode }
					>
						{ __( 'Customize' ) }
					</Button>
				) }

				<ActionsMenu items={ menuItems } />
			</Stack>
		);
	},
	{ AddWidget, LayoutSettings, Divider, Cancel, Done }
);
