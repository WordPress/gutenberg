/**
 * WordPress dependencies
 */
import { __experimentalNavigationItem as NavigationItem } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplatePreview from './template-preview';

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

export default function TemplateNavigationItems( {
	entityType = 'wp_template',
	templates,
	onActivate,
} ) {
	const [ hoveredTemplateId, setHoveredTemplateId ] = useState();

	const onMouseEnterTemplate = ( id ) => setHoveredTemplateId( id );
	const onMouseLeaveTemplate = () => setHoveredTemplateId( null );

	if ( ! templates ) {
		return null;
	}

	if ( ! Array.isArray( templates ) ) {
		templates = [ templates ];
	}

	const itemPrefix =
		entityType === 'wp_template_part' ? 'template-part' : 'template';

	return (
		<>
			{ templates.map( ( template ) => (
				<NavigationItem
					key={ `${ itemPrefix }-${ template.id }` }
					item={ `${ itemPrefix }-${ template.slug }` }
					title={ TITLES[ template.slug ]?.title ?? template.slug }
					onClick={ () => onActivate( template.id ) }
					onMouseEnter={ () => onMouseEnterTemplate( template.id ) }
					onMouseLeave={ onMouseLeaveTemplate }
				/>
			) ) }

			{ hoveredTemplateId && (
				<TemplatePreview
					entityType={ entityType }
					entityId={ hoveredTemplateId }
				/>
			) }
		</>
	);
}
