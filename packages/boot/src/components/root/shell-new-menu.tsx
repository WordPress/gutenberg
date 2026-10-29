import { useNavigate } from '@wordpress/route';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	IconButton,
	// eslint-disable-next-line @wordpress/use-recommended-components
	Menu,
} from '@wordpress/ui';

/**
 * A menu to add new content, like the "New" menu in the classic admin bar.
 *
 * @return The new content menu.
 */
export default function ShellNewMenu() {
	const navigate = useNavigate();

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<IconButton
						variant="minimal"
						tone="neutral"
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
	);
}
