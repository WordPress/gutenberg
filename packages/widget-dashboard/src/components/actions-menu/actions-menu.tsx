/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, IconButton, Tooltip } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

export interface ActionsMenuItem {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	/**
	 * Shown on hover when the item is disabled (for example, to explain
	 * why the action is unavailable).
	 */
	disabledTooltip?: string;
}

interface ActionsMenuProps {
	items: ActionsMenuItem[];
}

function ActionsMenuEntry( { item }: { item: ActionsMenuItem } ) {
	const showDisabledTooltip = item.disabled && item.disabledTooltip;

	const menuItem = (
		<Menu.Item
			disabled={ item.disabled }
			onClick={ item.onClick }
			render={ <Button variant="minimal" tone="neutral" /> }
		>
			{ item.label }
		</Menu.Item>
	);

	if ( ! showDisabledTooltip ) {
		return menuItem;
	}

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Menu.Item
						disabled={ item.disabled }
						onClick={ item.onClick }
						render={ <Button variant="minimal" tone="neutral" /> }
					/>
				}
			>
				{ item.label }
			</Tooltip.Trigger>
			<Tooltip.Popup positioner={ <Tooltip.Positioner side="bottom" /> }>
				{ item.disabledTooltip }
			</Tooltip.Popup>
		</Tooltip.Root>
	);
}

/**
 * Renders the dashboard's overflow menu: a three-dots trigger surfacing
 * secondary actions. Returns `null` when there are no items.
 *
 * @param {ActionsMenuProps} props Component props.
 */
export function ActionsMenu( { items }: ActionsMenuProps ): React.ReactNode {
	if ( items.length === 0 ) {
		return null;
	}

	return (
		<Menu>
			<Menu.TriggerButton
				render={
					<IconButton
						icon={ moreVertical }
						label={ __( 'More options' ) }
						variant="minimal"
						tone="brand"
						size="compact"
					/>
				}
			/>
			<Menu.Popover>
				<Tooltip.Provider delay={ 0 }>
					<Menu.Group>
						{ items.map( ( item, index ) => (
							<ActionsMenuEntry key={ index } item={ item } />
						) ) }
					</Menu.Group>
				</Tooltip.Provider>
			</Menu.Popover>
		</Menu>
	);
}
