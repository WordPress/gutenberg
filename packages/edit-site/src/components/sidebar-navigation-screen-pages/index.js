/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { useViewportMatch } from '@wordpress/compose';
import { pages as pagesIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItemPage from './sidebar-navigation-item-page';
import AddNewTemplate from '../add-new-template';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import { useHistory } from '../routes';
import { unlock } from '../../private-apis';
import SidebarNavigationItem from '../sidebar-navigation-item';

const config = {
	page: {
		labels: {
			title: __( 'Pages' ),
			loading: __( 'Loading pages' ),
			notFound: __( 'No pages found' ),
			description: __( 'Browse and edit pages on your site' ),
			manage: __( 'View all pages' ),
		},
	},
};

const PageItem = ( {
	onHover,
	postType,
	postId,
	status,
	modified,
	...props
} ) => {
	// const linkInfo = useLink( {
	// 	path: '/' + postType,
	// 	postType,
	// 	postId,
	// } );

	const linkInfo = useLink( {
		postType,
		postId,
	} );

	return (
		<SidebarNavigationItemPage
			linkInfo={ linkInfo }
			onHover={ onHover }
			status={ status }
			modified={ modified }
			{ ...props }
		/>
	);
};

export default function SidebarNavigationScreenPages() {
	const {
		params: { postType },
	} = useNavigator();

	const history = useHistory();

	const { setTemplate } = unlock( useDispatch( editSiteStore ) );

	const browseAllLink = useLink( {
		path: '/' + postType + '/all',
	} );

	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isTemplatePartsMode = useSelect( ( select ) => {
		const settings = select( editSiteStore ).getSettings();

		return !! settings.supportsTemplatePartsMode;
	}, [] );

	const [ filters ] = useState( {
		status: 'publish,draft',
		order: 'asc',
		orderby: 'modified',
	} );

	const { records: templates, isResolving: isLoading } = useEntityRecords(
		'postType',
		postType,
		{
			context: 'view',
			per_page: 5,
			...filters,
		},
		{
			enabled: true,
		}
	);

	const sortedTemplates = templates ? [ ...templates ] : [];

	const canCreate = ! isMobileViewport && ! isTemplatePartsMode;

	const handleItemHover = ( e, template ) => {
		e.stopPropagation();
		setTemplate( template.id, template.slug );
		history.push( {
			path: '/' + template.type,
			postId: template.id,
			postType: template.type,
		} );
	};

	return (
		<SidebarNavigationScreen
			isRoot={ isTemplatePartsMode }
			title={ config[ postType ].labels.title }
			description={ config[ postType ].labels.description }
			actions={
				canCreate && (
					<AddNewTemplate
						templateType={ postType }
						toggleProps={ {
							as: SidebarButton,
						} }
					/>
				)
			}
			content={
				<>
					{ /* <FilterBar
						filters={ filters }
						onFilterChange={ setFilters }
					/> */ }
					<ItemGroup>
						{ ! isMobileViewport &&
							config[ postType ].labels.manage && (
								<SidebarNavigationItem
									withChevron
									icon={ pagesIcon }
									className="edit-site-sidebar-navigation-item"
									{ ...browseAllLink }
									children={
										config[ postType ].labels.manage
									}
								/>
							) }
					</ItemGroup>

					<h3 className="edit-site-sidebar-navigation-screen__section-heading">
						Recently updated
					</h3>
					{ isLoading && config[ postType ].labels.loading }
					{ ! isLoading && (
						<>
							<ItemGroup>
								{ ! templates?.length && (
									<Item className="edit-site-sidebar-navigation-item">
										{ config[ postType ].labels.notFound }
									</Item>
								) }
								{ sortedTemplates.map( ( template ) => (
									<PageItem
										postType={ postType }
										postId={ template.id }
										status={ template.status }
										modified={ Date.parse(
											template.modified
										) }
										key={ template.id }
										onHover={ ( e ) =>
											handleItemHover( e, template )
										}
									>
										{ decodeEntities(
											template.title?.rendered ||
												template.slug
										) }
									</PageItem>
								) ) }
								{ /* { ! isMobileViewport &&
								config[ postType ].labels.manage && (
									<SidebarNavigationItem
										className="edit-site-sidebar-navigation-screen-templates__see-all"
										{ ...browseAllLink }
										children={
											config[ postType ].labels.manage
										}
									/>
								) } */ }
							</ItemGroup>
						</>
					) }
				</>
			}
		/>
	);
}
