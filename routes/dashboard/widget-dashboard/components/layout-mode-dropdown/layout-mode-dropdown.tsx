/**
 * External dependencies
 */
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, layout as layoutIcon } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Tooltip } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import type { WidgetGridModel } from '../../types';
import { getGridModel } from '../../utils/grid-model-change';

const { Menu } = unlock( componentsPrivateApis );

/**
 * Layout model picker shown beside "Add widget" while customizing. Choosing
 * Grid or Masonry publishes immediately and keeps edit mode active.
 *
 * @return {React.ReactNode} The layout mode dropdown.
 */
export function LayoutModeDropdown(): React.ReactNode {
	const { gridSettings, commitGridModelChange } =
		useDashboardInternalContext();
	const model = getGridModel( gridSettings );

	const onModelChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			const next = event.target.value as WidgetGridModel;
			commitGridModelChange( next, { preserveEditMode: true } );
		},
		[ commitGridModelChange ]
	);

	return (
		<Menu>
			<Menu.TriggerButton
				render={
					<Button variant="minimal" tone="brand" size="compact" />
				}
			>
				<Button.Icon icon={ layoutIcon } />
				{ __( 'Layout' ) }
				<Button.Icon icon={ chevronDown } />
			</Menu.TriggerButton>
			<Menu.Popover>
				<Tooltip.Provider delay={ 0 }>
					<Menu.Group>
						<Menu.GroupLabel>{ __( 'Layout' ) }</Menu.GroupLabel>
						<Menu.RadioItem
							name="dashboard-layout-mode"
							value="grid"
							checked={ model === 'grid' }
							onChange={ onModelChange }
						>
							<Menu.ItemLabel>{ __( 'Grid' ) }</Menu.ItemLabel>
							<Menu.ItemHelpText>
								{ __(
									'Widgets align into even rows and columns for a consistent layout.'
								) }
							</Menu.ItemHelpText>
						</Menu.RadioItem>
						<Menu.RadioItem
							name="dashboard-layout-mode"
							value="masonry"
							checked={ model === 'masonry' }
							onChange={ onModelChange }
						>
							<Menu.ItemLabel>{ __( 'Masonry' ) }</Menu.ItemLabel>
							<Menu.ItemHelpText>
								{ __(
									'Widgets stack to fill available space, allowing different item heights without leaving gaps.'
								) }
							</Menu.ItemHelpText>
						</Menu.RadioItem>
					</Menu.Group>
				</Tooltip.Provider>
			</Menu.Popover>
		</Menu>
	);
}
