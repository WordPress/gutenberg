/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { globe, layout, symbolFilled } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationTitle from '../sidebar-navigation-title';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLocation } from '../routes';

export default function SidebarNavigationRoot() {
	const { params } = useLocation();
	const browseLink = useLink( {
		postType: undefined,
		postId: undefined,
	} );
	const templatesLink = useLink( {
		postType: 'wp_template',
		postId: undefined,
	} );
	const templatePartsLink = useLink( {
		postType: 'wp_template_part',
		postId: undefined,
	} );

	return (
		<VStack spacing={ 6 }>
			<SidebarNavigationTitle
				parentTitle={ __( 'Dashboard' ) }
				title={ __( 'Design' ) }
				parentHref="index.php"
			/>
			<ItemGroup>
				<SidebarNavigationItem
					{ ...browseLink }
					icon={ globe }
					aria-pressed={
						( ! params.postType && ! params.postId ) ||
						( !! params.postType && !! params.postId )
					}
				>
					{ __( 'Browse' ) }
				</SidebarNavigationItem>
				<SidebarNavigationItem
					{ ...templatesLink }
					icon={ layout }
					aria-pressed={
						params.postType === 'wp_template' && ! params.postId
					}
				>
					{ __( 'Templates' ) }
				</SidebarNavigationItem>
				<SidebarNavigationItem
					{ ...templatePartsLink }
					icon={ symbolFilled }
					aria-pressed={
						params.postType === 'wp_template_part' &&
						! params.postId
					}
				>
					{ __( 'Template Parts' ) }
				</SidebarNavigationItem>
			</ItemGroup>
		</VStack>
	);
}
