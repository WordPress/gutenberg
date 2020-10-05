/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplatePreview from './template-preview';
import { NavigationPanelPreviewFill } from '.';

const TITLES = {
	'front-page': {
		title: 'Front page',
		description: '',
	},
	archive: {
		title: 'Archive',
		description: 'Just some description here',
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
			{ templates.map( ( template ) => {
				const { title, description } = TITLES[ template.slug ] ?? {};

				return (
					<NavigationItem
						className="edit-site-navigation-panel__template-item"
						key={ `${ itemPrefix }-${ template.id }` }
						item={ `${ itemPrefix }-${ template.slug }` }
						title={
							TITLES[ template.slug ]?.title ?? template.slug
						}
					>
						<Button
							onClick={ () => onActivate( template.id ) }
							onMouseEnter={ () =>
								onMouseEnterTemplate( template.id )
							}
							onMouseLeave={ onMouseLeaveTemplate }
						>
							{ title || template.slug }
							{ description && (
								<div className="edit-site-navigation-panel__template-item-description">
									{ TITLES[ template.slug ]?.description }
								</div>
							) }
						</Button>
					</NavigationItem>
				);
			} ) }

			{ hoveredTemplateId && (
				<NavigationPanelPreviewFill>
					<TemplatePreview
						entityType={ entityType }
						entityId={ hoveredTemplateId }
					/>
				</NavigationPanelPreviewFill>
			) }
		</>
	);
}
