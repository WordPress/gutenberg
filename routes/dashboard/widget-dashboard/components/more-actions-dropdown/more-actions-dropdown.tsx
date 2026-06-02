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
import { unlock } from '../../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

export interface MoreActionsDropdownItem {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	/**
	 * Shown on hover when the item is disabled (for example, to explain
	 * why the action is unavailable).
	 */
	disabledTooltip?: string;
}

interface MoreActionsDropdownProps {
	items: MoreActionsDropdownItem[];
}

function MoreActionsMenuItem( { item }: { item: MoreActionsDropdownItem } ) {
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
 * Renders a vertical-three-dots dropdown that surfaces secondary
 * actions for the dashboard. Each entry in `items` becomes a menu
 * item; clicking it fires the entry's `onClick` and closes the menu.
 *
 * Trigger and items both delegate their visual presentation to the
 * design system via Ariakit's `render` prop: `Menu.TriggerButton`
 * borrows `IconButton`, and each `Menu.Item` borrows `Button`. The
 * accessibility wiring (focus, keyboard, aria) stays with the menu
 * primitives.
 *
 * Returns `null` when `items` is empty so the dropdown collapses
 * gracefully without leaving an empty trigger in the toolbar.
 *
 * @param props
 * @param props.items Menu entries to render under the trigger.
 */
export function MoreActionsDropdown( {
	items,
}: MoreActionsDropdownProps ): React.ReactNode {
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
							<MoreActionsMenuItem key={ index } item={ item } />
						) ) }
					</Menu.Group>
				</Tooltip.Provider>
			</Menu.Popover>
		</Menu>
	);
}
