/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { useViewportMatch } from '@wordpress/compose';
import { getTemplatePartIcon } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useLink } from '../routes/link';
import SidebarNavigationItem from '../sidebar-navigation-item';
import AddNewTemplate from '../add-new-template';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';

const config = {
	wp_template: {
		labels: {
			title: __( 'Templates' ),
			loading: __( 'Loading templates' ),
			notFound: __( 'No templates found' ),
			manage: __( 'Manage all templates' ),
			description: __(
				'Express the layout of your site with templates.'
			),
		},
	},
	wp_template_part: {
		labels: {
			title: __( 'Library' ),
			loading: __( 'Loading library' ),
			notFound: __( 'No patterns found' ),
			manage: __( 'Manage all template parts' ),
			reusableBlocks: __( 'Manage patterns' ),
			description: __(
				'Template Parts are small pieces of a layout that can be reused across multiple templates and always appear the same way. Common template parts include the site header, footer, or sidebar.'
			),
		},
		sortCallback: ( items ) => {
			const groupedByArea = items.reduce(
				( accumulator, item ) => {
					const key = accumulator[ item.area ] ? item.area : 'rest';
					accumulator[ key ].push( item );
					return accumulator;
				},
				{ header: [], footer: [], sidebar: [], rest: [] }
			);
			return [
				...groupedByArea.header,
				...groupedByArea.footer,
				...groupedByArea.sidebar,
				...groupedByArea.rest,
			];
		},
	},
};

const TemplateItem = ( { postType, postId, ...props } ) => {
	const linkInfo = useLink( {
		postType,
		postId,
	} );
	return <SidebarNavigationItem { ...linkInfo } { ...props } />;
};

export default function SidebarNavigationScreenTemplates() {
	const {
		params: { postType },
	} = useNavigator();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isTemplatePartsMode = useSelect( ( select ) => {
		const settings = select( editSiteStore ).getSettings();

		return !! settings.supportsTemplatePartsMode;
	}, [] );

	const { records: templates, isResolving: isLoading } = useEntityRecords(
		'postType',
		postType,
		{
			per_page: -1,
		}
	);
	let sortedTemplates = templates ? [ ...templates ] : [];
	sortedTemplates.sort( ( a, b ) =>
		a.title.rendered.localeCompare( b.title.rendered )
	);
	if ( config[ postType ].sortCallback ) {
		sortedTemplates = config[ postType ].sortCallback( sortedTemplates );
	}

	const browseAllLink = useLink( {
		path: '/' + postType + '/all',
	} );

	const canCreate = ! isMobileViewport && ! isTemplatePartsMode;
	const isTemplateList = postType === 'wp_template';
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
					{ isLoading && config[ postType ].labels.loading }
					{ ! isLoading && (
						<ItemGroup>
							{ ! templates?.length && (
								<Item>
									{ config[ postType ].labels.notFound }
								</Item>
							) }
							{ sortedTemplates.map( ( template ) => (
								<TemplateItem
									postType={ postType }
									postId={ template.id }
									key={ template.id }
									withChevron
									icon={
										! isTemplateList &&
										getTemplatePartIcon( template.area )
									}
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
					<>
						<SidebarNavigationItem withChevron { ...browseAllLink }>
							{ config[ postType ].labels.manage }
						</SidebarNavigationItem>
						{ !! config[ postType ].labels.reusableBlocks && (
							<SidebarNavigationItem
								as="a"
								href="edit.php?post_type=wp_block"
							>
								{ config[ postType ].labels.reusableBlocks }
							</SidebarNavigationItem>
						) }
					</>
				)
			}
		/>
	);
}
