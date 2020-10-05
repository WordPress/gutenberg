/**
 * WordPress dependencies
 */
import { __experimentalNavigationItem as NavigationItem } from '@wordpress/components';

export default function TemplateNavigationItems( {
	items: templates,
	onActivate,
} ) {
	if ( ! templates ) {
		return null;
	}

	if ( ! Array.isArray( templates ) ) {
		templates = [ templates ];
	}

	return templates.map( ( template ) => (
		<NavigationItem
			key={ `template-${ template.id }` }
			item={ `template-${ template.slug }` }
			title={ template.slug }
			onClick={ () => onActivate( template.id ) }
		/>
	) );
}
