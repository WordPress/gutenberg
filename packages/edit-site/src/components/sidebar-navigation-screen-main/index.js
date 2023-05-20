/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalNavigatorButton as NavigatorButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout, symbol, navigation, styles, page } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { SidebarNavigationItemGlobalStyles } from '../sidebar-navigation-screen-global-styles';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';

export default function SidebarNavigationScreenMain() {
	const hasNavigationMenus = useSelect( ( select ) => {
		// The query needs to be the same as in the "SidebarNavigationScreenNavigationMenus" component,
		// to avoid double network calls.
		const navigationMenus = select( coreStore ).getEntityRecords(
			'postType',
			'wp_navigation',
			{
				per_page: 1,
				status: 'publish',
				order: 'desc',
				orderby: 'date',
			}
		);
		return !! navigationMenus?.length;
	}, [] );
	const showNavigationScreen = process.env.IS_GUTENBERG_PLUGIN
		? hasNavigationMenus
		: false;

	const editorCanvasContainerView = useSelect( ( select ) => {
		return unlock( select( editSiteStore ) ).getEditorCanvasContainerView();
	}, [] );

	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);

	// Clear the editor canvas container view when accessing the main navigation screen.
	useEffect( () => {
		if ( editorCanvasContainerView ) {
			setEditorCanvasContainerView( undefined );
		}
	}, [ editorCanvasContainerView, setEditorCanvasContainerView ] );

	return (
		<SidebarNavigationScreen
			isRoot
			title={ __( 'Design' ) }
			description={ __(
				'Customize the appearance of your website using the block editor.'
			) }
			content={
				<ItemGroup>
					{ showNavigationScreen && (
						<NavigatorButton
							as={ SidebarNavigationItem }
							path="/navigation"
							withChevron
							icon={ navigation }
						>
							{ __( 'Navigation' ) }
						</NavigatorButton>
					) }
					<SidebarNavigationItemGlobalStyles
						withChevron
						icon={ styles }
					>
						{ __( 'Styles' ) }
					</SidebarNavigationItemGlobalStyles>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/page"
						withChevron
						icon={ page }
					>
						{ __( 'Pages' ) }
					</NavigatorButton>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/wp_template"
						withChevron
						icon={ layout }
					>
						{ __( 'Templates' ) }
					</NavigatorButton>
					<NavigatorButton
						as={ SidebarNavigationItem }
						path="/wp_template_part"
						withChevron
						icon={ symbol }
					>
						{ __( 'Template Parts' ) }
					</NavigatorButton>
				</ItemGroup>
			}
		/>
	);
}
