/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationGroup as NavigationGroup,
} from '@wordpress/components';
import { plus, undo } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TemplatesPagesMenu from './templates-pages';
import NavigationItemWithIcon from '../navigation-item-with-icon';

const TEMPLATE_OVERRIDES = {
	page: ( slug ) => `page-${ slug }`,
	category: ( slug ) => `category-${ slug }`,
	post: ( slug ) => `single-post-${ slug }`,
};

const GENERAL_TEMPLATE_SLUGS = [
	'archive',
	'single',
	'singular',
	'index',
	'search',
	'404',
];

export default function TemplatesMenu( {
	page,
	activeId,
	onActiveIdChange,
	onAddTemplate,
	onRemoveTemplate,
} ) {
	const { currentTemplate, templates } = useSelect(
		( select ) => {
			const { getEntityRecord, getEntityRecords } = select( 'core' );

			return {
				currentTemplate: getEntityRecord(
					'postType',
					'wp_template',
					activeId
				),
				templates: getEntityRecords( 'postType', 'wp_template' ),
			};
		},
		[ activeId ]
	);

	const overwriteSlug =
		page &&
		TEMPLATE_OVERRIDES[ page.type ] &&
		page.slug &&
		TEMPLATE_OVERRIDES[ page.type ]( page.slug );

	const overwriteTemplate = () =>
		onAddTemplate( {
			slug: overwriteSlug,
			title: overwriteSlug,
			status: 'publish',
			content: currentTemplate.content.raw,
		} );
	const revertToParent = () => {
		onRemoveTemplate( activeId );
	};

	const generalTemplates = templates?.filter( ( { slug } ) =>
		GENERAL_TEMPLATE_SLUGS.includes( slug )
	);

	return (
		<NavigationMenu menu="templates" title="Templates" parentMenu="root">
			<NavigationItem navigateToMenu="templates-pages" title="Pages" />

			{ generalTemplates?.map( ( template ) => (
				<NavigationItemWithIcon
					key={ `template-${ template.id }` }
					item={ `template-${ template.id }` }
					title={ template.slug }
					onClick={ () => onActiveIdChange( template.id ) }
				/>
			) ) }

			<NavigationGroup title="Current template">
				<NavigationItem
					title={ currentTemplate?.slug ?? __( 'Loading…' ) }
				/>
				{ overwriteSlug &&
					currentTemplate &&
					overwriteSlug !== currentTemplate.slug && (
						<NavigationItemWithIcon
							icon={ plus }
							onClick={ overwriteTemplate }
							title={ __( 'Overwrite Template' ) }
						/>
					) }

				{ currentTemplate && overwriteSlug === currentTemplate.slug && (
					<NavigationItemWithIcon
						icon={ undo }
						onClick={ revertToParent }
						title={ __( 'Revert to Parent' ) }
					/>
				) }
			</NavigationGroup>

			<TemplatesPagesMenu
				templates={ templates }
				onActiveIdChange={ onActiveIdChange }
			/>
		</NavigationMenu>
	);
}
