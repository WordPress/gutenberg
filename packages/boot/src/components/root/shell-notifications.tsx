import { __ } from '@wordpress/i18n';
import { bell } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	IconButton,
	// eslint-disable-next-line @wordpress/use-recommended-components
	Popover,
} from '@wordpress/ui';
import styles from './shell-notifications.module.scss';

/**
 * The notifications button in the site shell's bar. A placeholder for now:
 * it opens a popover with nothing to show.
 *
 * @return The notifications button.
 */
export default function ShellNotifications() {
	return (
		<Popover.Root>
			<Popover.Trigger
				render={
					<IconButton
						variant="minimal"
						tone="neutral"
						icon={ bell }
						label={ __( 'Notifications' ) }
					/>
				}
			/>
			<Popover.Popup
				className={ styles.popup }
				positioner={ <Popover.Positioner align="end" /> }
			>
				<Popover.Title className={ styles.title }>
					{ __( 'Notifications' ) }
				</Popover.Title>
				<Popover.Description>
					{ __( 'You’re all caught up.' ) }
				</Popover.Description>
			</Popover.Popup>
		</Popover.Root>
	);
}
