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

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItemPage from './sidebar-navigation-item-page';
import AddNewTemplate from '../add-new-template';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import FilterBar from './filter-bar';
import { useHistory } from '../routes';
import { unlock } from '../../private-apis';

const config = {
	page: {
		labels: {
			title: __( 'Pages' ),
			loading: __( 'Loading pages' ),
			notFound: __( 'No pages found' ),
			description: __( 'Browse and edit pages on your site' ),
		},
	},
};

const PageItem = ( {
	onInfoClick,
	postType,
	postId,
	status,
	modified,
	...props
} ) => {
	const previewLinkInfo = useLink( {
		path: '/' + postType,
		postType,
		postId,
	} );

	return (
		<SidebarNavigationItemPage
			previewLinkInfo={ previewLinkInfo }
			onInfoClick={ onInfoClick }
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

	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isTemplatePartsMode = useSelect( ( select ) => {
		const settings = select( editSiteStore ).getSettings();

		return !! settings.supportsTemplatePartsMode;
	}, [] );

	const [ filters, setFilters ] = useState( { status: 'publish,draft' } );

	const { records: templates, isResolving: isLoading } = useEntityRecords(
		'postType',
		postType,
		{
			per_page: -1,
			order: 'asc',
			orderby: 'date',
			...filters,
		}
	);

	const sortedTemplates = templates ? [ ...templates ] : [];
	sortedTemplates.sort( ( a, b ) => a.slug.localeCompare( b.slug ) );

	const canCreate = ! isMobileViewport && ! isTemplatePartsMode;

	const handleInfoClick = ( e, template ) => {
		e.stopPropagation();
		setTemplate( template.id, template.slug );
		history.push( {
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
					<FilterBar
						filters={ filters }
						onFilterChange={ setFilters }
					/>
					{ isLoading && config[ postType ].labels.loading }
					{ ! isLoading && (
						<ItemGroup>
							{ ! templates?.length && (
								<Item>
									{ config[ postType ].labels.notFound }
								</Item>
							) }
							{ sortedTemplates.map( ( template ) => (
								<PageItem
									postType={ postType }
									postId={ template.id }
									status={ template.status }
									modified={ Date.parse( template.modified ) }
									key={ template.id }
									onInfoClick={ ( e ) =>
										handleInfoClick( e, template )
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
					) }
				</>
			}
		/>
	);
}
