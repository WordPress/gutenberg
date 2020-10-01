/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationMenu as NavigationMenu,
} from '@wordpress/components';

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
					<NavigationItem
						key={ `template-${ template.id }` }
						item={ `template-${ template.slug }` }
						title={ template.slug }
						onClick={ () => onActiveIdChange( template.id ) }
					/>
				) ) }
			</NavigationGroup>

			{ defaultTemplate && (
				<NavigationGroup title="General">
					{ [ defaultTemplate ].map( ( template ) => (
						<NavigationItem
							key={ `template-${ template.id }` }
							item={ `template-${ template.slug }` }
							title={ template.slug }
							onClick={ () => onActiveIdChange( template.id ) }
						/>
					) ) }
				</NavigationGroup>
			) }
		</NavigationMenu>
	);
}
