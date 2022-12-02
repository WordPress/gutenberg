/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalVStack as HStack,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorBackButton as NavigatorBackButton,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
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

const Item = ( { item } ) => {
	const linkInfo = useLink( item.params );
	if ( item.params ) {
		delete item.params;
		item = {
			...item,
			...linkInfo,
		};
	}
	return <SidebarNavigationItem { ...item } />;
};

export default function SidebarNavigationScreenTemplates() {
	const { params } = useLocation();
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;

	const { records: templates, isResolving: isLoading } = useEntityRecords(
		'postType',
		'wp_template',
		{
			per_page: -1,
		}
	);

	let items = [];
	if ( isLoading ) {
		items = [
			{
				children: __( 'Loading templates' ),
			},
		];
	} else if ( ! templates && ! isLoading ) {
		items = [
			{
				children: __( 'No templates found' ),
			},
		];
	} else {
		items = templates?.map( ( template ) => ( {
			params: {
				postType: 'wp_template',
				postId: template.id,
			},
			icon: layout,
			children: decodeEntities(
				template.title?.rendered || template.slug
			),
			'aria-current':
				params.postType === 'wp_template' &&
				params.postId === template.id
					? 'page'
					: undefined,
		} ) );
	}

	return (
		<NavigatorScreen path="/templates">
			<VStack spacing={ 6 }>
				<NavigatorBackButton
					as={ SidebarNavigationTitle }
					parentTitle={ __( 'Design' ) }
					title={
						<HStack style={ { minHeight: 36 } }>
							<div>{ __( 'Templates' ) }</div>
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
						{ items.map( ( item, index ) => (
							<Item item={ item } key={ index } />
						) ) }
					</ItemGroup>
				</nav>
				<SidebarNavigationItem
					{ ...useLink( {
						postType: 'wp_template',
						postId: undefined,
					} ) }
					children={ __( 'Manage all templates' ) }
				/>
			</VStack>
		</NavigatorScreen>
	);
}
