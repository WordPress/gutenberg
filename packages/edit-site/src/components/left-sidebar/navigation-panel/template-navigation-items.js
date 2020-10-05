/**
 * WordPress dependencies
 */
import { __experimentalNavigationItem as NavigationItem } from '@wordpress/components';

const TITLES = {
	'front-page': {
		title: 'Front page',
		description: '',
	},
	archive: {
		title: 'Archive',
		description: '',
	},
	single: {
		title: 'Single',
		description: '',
	},
	singular: {
		title: 'Singular',
		description: '',
	},
	index: {
		title: 'Default (index)',
		description: '',
	},
	search: {
		title: 'Search results',
		description: '',
	},
	'404': {
		title: '404',
		description: '',
	},
};

export default function TemplateNavigationItems( { templates, onActivate } ) {
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
			title={ TITLES[ template.slug ]?.title ?? template.slug }
			onClick={ () => onActivate( template.id ) }
		/>
	) );
}
