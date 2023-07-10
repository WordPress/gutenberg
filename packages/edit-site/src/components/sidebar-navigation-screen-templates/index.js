/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import AddNewTemplate from '../add-new-template';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';

const TemplateItem = ( { postType, postId, ...props } ) => {
	const linkInfo = useLink( {
		postType,
		postId,
	} );
	return <SidebarNavigationItem { ...linkInfo } { ...props } />;
};

export default function SidebarNavigationScreenTemplates() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isTemplatePartsMode = useSelect( ( select ) => {
		const settings = select( editSiteStore ).getSettings();

		return !! settings.supportsTemplatePartsMode;
	}, [] );

	const { records: templates, isResolving: isLoading } = useEntityRecords(
		'postType',
		'wp_template',
		{
			per_page: -1,
		}
	);

	const sortedTemplates = templates ? [ ...templates ] : [];
	sortedTemplates.sort( ( a, b ) =>
		a.title.rendered.localeCompare( b.title.rendered )
	);

	const browseAllLink = useLink( { path: '/wp_template/all' } );
	const canCreate = ! isMobileViewport && ! isTemplatePartsMode;
	return (
		<SidebarNavigationScreen
			isRoot={ isTemplatePartsMode }
			title={ __( 'Templates' ) }
			description={ __(
				'Express the layout of your site with templates'
			) }
			actions={
				canCreate && (
					<AddNewTemplate
						templateType={ 'wp_template' }
						toggleProps={ {
							as: SidebarButton,
						} }
					/>
				)
			}
			content={
				<>
					{ isLoading && __( 'Loading templates' ) }
					{ ! isLoading && (
						<ItemGroup>
							{ ! templates?.length && (
								<Item>{ __( 'No templates found' ) }</Item>
							) }
							{ sortedTemplates.map( ( template ) => (
								<TemplateItem
									postType={ 'wp_template' }
									postId={ template.id }
									key={ template.id }
									withChevron
								>
									{ decodeEntities(
										template.title?.rendered ||
											template.slug
									) }
								</TemplateItem>
							) ) }
						</ItemGroup>
					) }
				</>
			}
			footer={
				! isMobileViewport && (
					<SidebarNavigationItem withChevron { ...browseAllLink }>
						{ __( 'Manage all templates' ) }
					</SidebarNavigationItem>
				)
			}
		/>
	);
}
