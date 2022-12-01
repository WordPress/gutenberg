/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorBackButton as NavigatorBackButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout } from '@wordpress/icons';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import SidebarNavigationTitle from '../sidebar-navigation-title';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';

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
		} ) );
	}

	return (
		<NavigatorScreen path="/templates">
			<VStack spacing={ 6 }>
				<NavigatorBackButton
					as={ SidebarNavigationTitle }
					parentTitle={ __( 'Design' ) }
					title={ __( 'Templates' ) }
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
