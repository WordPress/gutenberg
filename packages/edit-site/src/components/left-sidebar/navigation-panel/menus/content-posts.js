/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationEntityItems from '../navigation-entity-items';

export default function ContentPostsMenu() {
	return (
		<NavigationMenu
			menu="content-posts"
			title={ __( 'Posts' ) }
			parentMenu="root"
		>
			<NavigationEntityItems kind="postType" name="post" />
		</NavigationMenu>
	);
}
