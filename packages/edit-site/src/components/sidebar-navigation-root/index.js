/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout, symbolFilled } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SidebarNavigationTitle from '../sidebar-navigation-title';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLocation } from '../routes';
import { store as editSiteStore } from '../../store';

export default function SidebarNavigationRoot() {
	const { params } = useLocation();
	const templatesLink = useLink( {
		postType: 'wp_template',
		postId: undefined,
	} );
	const templatePartsLink = useLink( {
		postType: 'wp_template_part',
		postId: undefined,
	} );
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isTemplatesPage =
		params.postType === 'wp_template' && ! params.postId;
	const isTemplatePartsPage =
		params.postType === 'wp_template_part' && ! params.postId;

	return (
		<VStack spacing={ 6 }>
			<SidebarNavigationTitle
				title={
					<HStack>
						<div>{ __( 'Design' ) }</div>
						{ ! isMobileViewport && (
							<Button
								className="edit-site-layout__edit-button"
								label={ __( 'Open the editor' ) }
								onClick={ () => {
									__unstableSetCanvasMode( 'edit' );
								} }
							>
								{ __( 'Edit' ) }
							</Button>
						) }
					</HStack>
				}
			/>
			<nav className="edit-site-sidebar-navigation-root">
				<ItemGroup>
					<SidebarNavigationItem
						{ ...templatesLink }
						icon={ layout }
						aria-current={ isTemplatesPage ? 'page' : undefined }
					>
						{ __( 'Templates' ) }
					</SidebarNavigationItem>
					<SidebarNavigationItem
						{ ...templatePartsLink }
						icon={ symbolFilled }
						aria-current={
							isTemplatePartsPage ? 'page' : undefined
						}
					>
						{ __( 'Template Parts' ) }
					</SidebarNavigationItem>
				</ItemGroup>
			</nav>
		</VStack>
	);
}
