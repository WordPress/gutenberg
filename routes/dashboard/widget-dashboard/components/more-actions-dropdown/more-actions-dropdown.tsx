/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, IconButton } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

export interface MoreActionsDropdownItem {
	label: string;
	onClick: () => void;
	disabled?: boolean;
}

interface MoreActionsDropdownProps {
	items: MoreActionsDropdownItem[];
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
				<Menu.Group>
					{ items.map( ( item, index ) => (
						<Menu.Item
							key={ index }
							disabled={ item.disabled }
							onClick={ item.onClick }
							render={
								<Button variant="minimal" tone="neutral" />
							}
						>
							{ item.label }
						</Menu.Item>
					) ) }
				</Menu.Group>
			</Menu.Popover>
		</Menu>
	);
}
