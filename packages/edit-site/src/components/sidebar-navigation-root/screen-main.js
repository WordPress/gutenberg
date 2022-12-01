/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorButton as NavigatorButton,
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
import getIsListPage from '../../utils/get-is-list-page';

export default function SidebarNavigationScreenMain() {
	const { params } = useLocation();
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;
	const templatesLink = useLink( {
		postType: 'wp_template',
		postId: 'twentytwentythree//index', // TODO: retrieve current theme
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
		<NavigatorScreen path="/">
			<VStack spacing={ 6 }>
				<SidebarNavigationTitle
					title={
						<HStack style={ { minHeight: 36 } }>
							<div>{ __( 'Design' ) }</div>
							{ ! isMobileViewport && isEditorPage && (
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
						<NavigatorButton
							as={ SidebarNavigationItem }
							path="/templates"
							withChevron={ true }
							{ ...templatesLink }
							icon={ layout }
							aria-current={
								isTemplatesPage ? 'page' : undefined
							}
						>
							{ __( 'Templates' ) }
						</NavigatorButton>
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
		</NavigatorScreen>
	);
}
