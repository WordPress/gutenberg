/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalVStack as VStack,
} from '@wordpress/components';
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
import SidebarButton from '../sidebar-button';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';

const TemplateItem = ( { postType, postId, ...props } ) => {
	const linkInfo = useLink( {
		postType,
		postId,
	} );
	return <SidebarNavigationItem { ...linkInfo } { ...props } />;
};

export default function SidebarNavigationScreenTemplates() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { records: templates, isResolving: isLoading } = useEntityRecords(
		'postType',
		TEMPLATE_POST_TYPE,
		{ per_page: -1 }
	);
	const browseAllLink = useLink( { path: '/wp_template/all' } );
	const canCreate = ! isMobileViewport;
	return (
		<SidebarNavigationScreen
			title={ __( 'Templates' ) }
			description={ __(
				'Express the layout of your site with templates.'
			) }
			actions={
				canCreate && (
					<AddNewTemplate
						templateType={ TEMPLATE_POST_TYPE }
						toggleProps={ {
							as: SidebarButton,
						} }
					/>
				)
			}
			content={
				<>
					{ isLoading && __( 'Loading templates…' ) }
					{ ! isLoading && (
						<SidebarTemplatesList templates={ templates } />
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

function TemplatesGroup( { title, templates } ) {
	return (
		<ItemGroup>
			{ !! title && (
				<Item className="edit-site-sidebar-navigation-screen-templates__templates-group-title">
					{ title }
				</Item>
			) }
			{ templates.map( ( template ) => (
				<TemplateItem
					postType={ TEMPLATE_POST_TYPE }
					postId={ template.id }
					key={ template.id }
					withChevron
				>
					{ decodeEntities(
						template.title?.rendered || template.slug
					) }
				</TemplateItem>
			) ) }
		</ItemGroup>
	);
}
function SidebarTemplatesList( { templates } ) {
	if ( ! templates?.length ) {
		return (
			<ItemGroup>
				<Item>{ __( 'No templates found' ) }</Item>
			</ItemGroup>
		);
	}
	const sortedTemplates = templates ? [ ...templates ] : [];
	sortedTemplates.sort( ( a, b ) =>
		a.title.rendered.localeCompare( b.title.rendered )
	);
	const { hierarchyTemplates, customTemplates, ...plugins } =
		sortedTemplates.reduce(
			( accumulator, template ) => {
				const {
					original_source: originalSource,
					author_text: authorText,
				} = template;
				if ( originalSource === 'plugin' ) {
					if ( ! accumulator[ authorText ] ) {
						accumulator[ authorText ] = [];
					}
					accumulator[ authorText ].push( template );
				} else if ( template.is_custom ) {
					accumulator.customTemplates.push( template );
				} else {
					accumulator.hierarchyTemplates.push( template );
				}
				return accumulator;
			},
			{ hierarchyTemplates: [], customTemplates: [] }
		);
	return (
		<VStack spacing={ 3 }>
			{ !! hierarchyTemplates.length && (
				<TemplatesGroup templates={ hierarchyTemplates } />
			) }
			{ !! customTemplates.length && (
				<TemplatesGroup
					title={ __( 'Custom' ) }
					templates={ customTemplates }
				/>
			) }
			{ Object.entries( plugins ).map(
				( [ plugin, pluginTemplates ] ) => {
					return (
						<TemplatesGroup
							key={ plugin }
							title={ plugin }
							templates={ pluginTemplates }
						/>
					);
				}
			) }
		</VStack>
	);
}
