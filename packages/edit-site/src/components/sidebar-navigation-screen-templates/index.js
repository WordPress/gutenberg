/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import AddNewTemplate from '../add-new-template';

function omit( object, keys ) {
	return Object.fromEntries(
		Object.entries( object ).filter( ( [ key ] ) => ! keys.includes( key ) )
	);
}

const config = {
	wp_template: {
		path: '/templates',
		labels: {
			title: __( 'Templates' ),
			loading: __( 'Loading templates' ),
			notFound: __( 'No templates found' ),
			manage: __( 'Manage all templates' ),
		},
	},
	wp_template_part: {
		path: '/template-parts',
		labels: {
			title: __( 'Template parts' ),
			loading: __( 'Loading template parts' ),
			notFound: __( 'No template parts found' ),
			manage: __( 'Manage all template parts' ),
		},
	},
};

const Item = ( { item } ) => {
	const linkInfo = useLink( {
		...item.params,
		path: config[ item.params.postType ].path + '/single',
	} );
	const props = item.params
		? { ...omit( item, 'params' ), ...linkInfo }
		: item;
	return <SidebarNavigationItem { ...props } />;
};

export default function SidebarNavigationScreenTemplates( {
	postType = 'wp_template',
} ) {
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const { records: templates, isResolving: isLoading } = useEntityRecords(
		'postType',
		postType,
		{
			per_page: -1,
		}
	);

	let items = [];
	if ( isLoading ) {
		items = [
			{
				children: config[ postType ].labels.loading,
			},
		];
	} else if ( ! templates && ! isLoading ) {
		items = [
			{
				children: config[ postType ].labels.notFound,
			},
		];
	} else {
		items = templates?.map( ( template ) => ( {
			params: {
				postType,
				postId: template.id,
			},
			children: decodeEntities(
				template.title?.rendered || template.slug
			),
		} ) );
	}

	const browseAllLink = useLink( {
		postType,
		postId: undefined,
		path: config[ postType ].path + '/all',
	} );

	return (
		<SidebarNavigationScreen
			path={ config[ postType ].path }
			title={ config[ postType ].labels.title }
			actions={
				! isMobileViewport && (
					<AddNewTemplate
						templateType={ postType }
						toggleProps={ {
							className:
								'edit-site-sidebar-navigation-screen-templates__add-button',
						} }
					/>
				)
			}
			content={
				<>
					<ItemGroup>
						{ items.map( ( item, index ) => (
							<Item item={ item } key={ index } />
						) ) }

						{ ! isMobileViewport && (
							<SidebarNavigationItem
								className="edit-site-sidebar-navigation-screen-templates__see-all"
								{ ...browseAllLink }
								children={ config[ postType ].labels.manage }
							/>
						) }
					</ItemGroup>
				</>
			}
		/>
	);
}
