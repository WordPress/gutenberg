/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
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
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLocation } from '../routes';
import { store as editSiteStore } from '../../store';
import getIsListPage from '../../utils/get-is-list-page';

export default function SidebarNavigationScreenMain() {
	const { params } = useLocation();
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	return (
		<SidebarNavigationScreen
			path="/"
			title={
				<HStack justify="space-between" style={ { minHeight: 36 } }>
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
						withChevron
						icon={ layout }
					>
						{ __( 'Templates' ) }
					</NavigatorButton>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/template-parts"
						withChevron
						icon={ symbolFilled }
					>
						{ __( 'Template Parts' ) }
					</NavigatorButton>
				</ItemGroup>
			}
		/>
	);
}
