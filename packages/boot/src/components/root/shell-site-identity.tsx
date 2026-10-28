import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useNavigate } from '@wordpress/route';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { plus } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	IconButton,
	// eslint-disable-next-line @wordpress/use-recommended-components
	Menu,
	Text,
} from '@wordpress/ui';
import styles from './shell-site-identity.module.scss';

/**
 * The site's icon and name, and a menu to add new content, like the "New"
 * menu in the classic admin bar.
 *
 * @return The site identity and the new content menu.
 */
export default function ShellSiteIdentity() {
	const navigate = useNavigate();
	const { name, iconUrl } = useSelect( ( select ) => {
		const base = select( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		) as { name?: string; site_icon_url?: string } | undefined;
		return {
			name: decodeEntities( base?.name ?? '' ),
			iconUrl: base?.site_icon_url,
		};
	}, [] );

	return (
		<>
			<div className={ styles.identity }>
				{ iconUrl && (
					<img className={ styles.icon } src={ iconUrl } alt="" />
				) }
				<Text variant="body-sm" className={ styles.name }>
					{ name || __( 'Site' ) }
				</Text>
			</div>
			<Menu.Root>
				<Menu.Trigger
					render={
						<IconButton
							variant="minimal"
							tone="neutral"
							size="compact"
							icon={ plus }
							label={ __( 'New' ) }
						/>
					}
				/>
				<Menu.Popup>
					<Menu.Item
						onClick={ () => navigate( { to: '/types/post/new' } ) }
					>
						<Menu.ItemLabel>{ __( 'Post' ) }</Menu.ItemLabel>
					</Menu.Item>
					{ /* Not wired up in the site shell yet. */ }
					<Menu.Item disabled>
						<Menu.ItemLabel>{ __( 'Media' ) }</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Item
						onClick={ () => navigate( { to: '/types/page/new' } ) }
					>
						<Menu.ItemLabel>{ __( 'Page' ) }</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Item disabled>
						<Menu.ItemLabel>{ __( 'User' ) }</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		</>
	);
}
