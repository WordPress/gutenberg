/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorButton as NavigatorButton,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout, symbolFilled } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLocation } from '../routes';
import { store as editSiteStore } from '../../store';
import getIsListPage from '../../utils/get-is-list-page';

export default function SidebarNavigationScreenMain() {
	const { params } = useLocation();
	const templateId = useSelect( ( select ) => {
		return select( editSiteStore ).getEditedPostId();
	} );
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;
	const templatesLink = useLink( {
		postType: 'wp_template',
		postId: templateId,
	} );
	const templatePartsLink = useLink( {
		postType: 'wp_template_part',
		postId: undefined,
	} );
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isTemplatesPage = params.postType === 'wp_template';
	const isTemplatePartsPage =
		params.postType === 'wp_template_part' && ! params.postId;

	return (
		<NavigatorScreen path="/">
			<SidebarNavigationScreen
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
				content={
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
				}
			/>
		</NavigatorScreen>
	);
}
