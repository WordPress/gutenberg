/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useLocation } from '../routes';
import { store as editSiteStore } from '../../store';
import AddNewTemplate from '../add-new-template';

function omit( object, keys ) {
	return Object.fromEntries(
		Object.entries( object ).filter( ( [ key ] ) => ! keys.includes( key ) )
	);
}

const Item = ( { item } ) => {
	const linkInfo = useLink( item.params );
	const props = item.params
		? { ...omit( item, 'params' ), ...linkInfo }
		: item;
	return <SidebarNavigationItem { ...props } />;
};

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

export default function SidebarNavigationScreenTemplates( {
	postType = 'wp_template',
} ) {
	const { params } = useLocation();
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	// Ideally the URL params would be enough.
	// Loading the editor should ideally redirect to the home page
	// instead of fetching the edited entity here.
	const { editedPostId, editedPostType } = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		return {
			editedPostId: getEditedPostId(),
			editedPostType: getEditedPostType(),
		};
	}, [] );

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
			'aria-current':
				( params.postType === postType &&
					params.postId === template.id ) ||
				// This is a special case for the home page.
				( editedPostId === template.id &&
					editedPostType === postType &&
					!! params.postId )
					? 'page'
					: undefined,
		} ) );
	}

	return (
		<SidebarNavigationScreen
			path={ config[ postType ].path }
			parentTitle={ __( 'Design' ) }
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

						<SidebarNavigationItem
							className="edit-site-sidebar-navigation-screen-templates__see-all"
							{ ...useLink( {
								postType,
								postId: undefined,
							} ) }
							aria-current={
								params.postType === postType && ! params.postId
									? 'page'
									: undefined
							}
							children={ config[ postType ].labels.manage }
						/>
					</ItemGroup>
				</>
			}
		/>
	);
}
