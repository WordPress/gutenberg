/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationEntityItems from '../navigation-entity-items';

export default function ContentPagesMenu() {
	return (
		<NavigationMenu
			menu="content-pages"
			title={ __( 'Pages' ) }
			parentMenu="root"
		>
			<NavigationEntityItems kind="postType" name="page" />
		</NavigationMenu>
	);
}
