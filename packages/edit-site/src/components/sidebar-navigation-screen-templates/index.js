/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalNavigatorScreen as NavigatorScreen,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout, symbolFilled } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
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
import getIsListPage from '../../utils/get-is-list-page';

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
		icon: layout,
	},
	wp_template_part: {
		path: '/template-parts',
		labels: {
			title: __( 'Template parts' ),
			loading: __( 'Loading template parts' ),
			notFound: __( 'No template parts found' ),
			manage: __( 'Manage all template parts' ),
		},
		icon: symbolFilled,
	},
};

export default function SidebarNavigationScreenTemplates( {
	postType = 'wp_template',
} ) {
	const { params } = useLocation();
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;

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
			icon: config[ postType ].icon,
			children: decodeEntities(
				template.title?.rendered || template.slug
			),
			'aria-current':
				params.postType === postType && params.postId === template.id
					? 'page'
					: undefined,
		} ) );
	}

	return (
		<NavigatorScreen path={ config[ postType ].path }>
			<SidebarNavigationScreen
				parentTitle={ __( 'Design' ) }
				title={
					<HStack style={ { minHeight: 36 } }>
						<div>{ config[ postType ].labels.title }</div>
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
					<>
						<ItemGroup>
							{ items.map( ( item, index ) => (
								<Item item={ item } key={ index } />
							) ) }
						</ItemGroup>

						<SidebarNavigationItem
							{ ...useLink( {
								postType,
								postId: undefined,
							} ) }
							style={ { textAlign: 'center' } }
							children={ config[ postType ].labels.manage }
						/>
					</>
				}
			/>
		</NavigatorScreen>
	);
}
