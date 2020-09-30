/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplateNavigationItemWithIcon from '../navigation-item-with-icon';

export default function TemplatesPagesMenu( { templates, onActiveIdChange } ) {
	const defaultTemplate = templates?.find( ( { slug } ) => slug === 'page' );
	const specificPageTemplates = templates?.filter( ( { slug } ) =>
		slug.startsWith( 'page-' )
	);

	if (
		! defaultTemplate &&
		( ! specificPageTemplates || specificPageTemplates.length === 0 )
	) {
		return null;
	}

	return (
		<NavigationMenu
			menu="templates-pages"
			title="Pages"
			parentMenu="templates"
		>
			<NavigationGroup title="Specific">
				{ specificPageTemplates?.map( ( template ) => (
					<TemplateNavigationItemWithIcon
						key={ `template-${ template.id }` }
						item={ `template-${ template.id }` }
						title={ template.slug }
						onClick={ () => onActiveIdChange( template.id ) }
					/>
				) ) }
			</NavigationGroup>

			{ defaultTemplate && (
				<NavigationGroup title="General">
					{ [ defaultTemplate ].map( ( template ) => (
						<TemplateNavigationItemWithIcon
							key={ `template-${ template.id }` }
							item={ `template-${ template.id }` }
							title={ template.slug }
							onClick={ () => onActiveIdChange( template.id ) }
						/>
					) ) }
				</NavigationGroup>
			) }
		</NavigationMenu>
	);
}
