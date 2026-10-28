import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Avatar,
	// eslint-disable-next-line @wordpress/use-recommended-components
	Button,
	// eslint-disable-next-line @wordpress/use-recommended-components
	Menu,
} from '@wordpress/ui';
import { store as bootStore } from '../../store';
import styles from './shell-account-menu.module.scss';

/**
 * The current user's account menu, at the end of the site shell's bar. A
 * placeholder for now, with links to the profile screen and logging out.
 *
 * @return The account menu.
 */
export default function ShellAccountMenu() {
	const { name, avatarUrl, adminUrl } = useSelect( ( select ) => {
		const user = select( coreStore ).getCurrentUser();
		return {
			name: user?.name ?? '',
			avatarUrl: user?.avatar_urls?.[ '48' ],
			adminUrl: select( bootStore ).getDashboardLink() ?? '/wp-admin/',
		};
	}, [] );

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<Button
						variant="minimal"
						tone="neutral"
						className={ styles.trigger }
						aria-label={ __( 'Account' ) }
					/>
				}
			>
				<Avatar.Root size="sm">
					{ avatarUrl && <Avatar.Image src={ avatarUrl } alt="" /> }
					<Avatar.Fallback>
						<Avatar.Initials name={ name } />
					</Avatar.Fallback>
				</Avatar.Root>
			</Menu.Trigger>
			<Menu.Popup>
				<Menu.LinkItem href={ `${ adminUrl }profile.php` }>
					<Menu.ItemLabel>{ __( 'Edit profile' ) }</Menu.ItemLabel>
				</Menu.LinkItem>
				<Menu.LinkItem
					href={ adminUrl.replace(
						/wp-admin\/?$/,
						'wp-login.php?action=logout'
					) }
				>
					<Menu.ItemLabel>{ __( 'Log out' ) }</Menu.ItemLabel>
				</Menu.LinkItem>
			</Menu.Popup>
		</Menu.Root>
	);
}
