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
	// General
	'front-page': {
		title: 'Front page',
		description: '',
	},
	archive: {
		title: 'Archive',
		description:
			'Displays the content lists when no other template is found',
	},
	single: {
		title: 'Single',
		description: 'Displays the content of a single post',
	},
	singular: {
		title: 'Singular',
		description: 'Displays the content of a single page',
	},
	index: {
		title: 'Default (index)',
		description: 'Displays the content of a single page',
	},
	search: {
		title: 'Search results',
		description: '',
	},
	'404': {
		title: '404',
		description: 'Displayed when a non-existing page requested',
	},

	// Pages
	page: {
		title: 'Default (Page)',
		description: 'Displays the content of a single page',
	},

	// Posts
	home: {
		title: 'Posts (home)',
		description: 'Displayed on your homepage',
	},
	'archive-post': {
		title: 'Default (Post archive)',
		description: 'Displays a list of posts',
	},
	'single-post': {
		title: 'Default (Single post)',
		description: 'Displays the content of a single post',
	},
};

export default function TemplateNavigationItems( {
	entityType = 'wp_template',
	templates,
	onActivate,
} ) {
	const [ hoveredTemplate, setHoveredTemplate ] = useState();

	const onMouseEnterTemplate = ( template ) => setHoveredTemplate( template );
	const onMouseLeaveTemplate = () => setHoveredTemplate( null );

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
								onMouseEnterTemplate( template )
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

			{ hoveredTemplate?.content?.raw && (
				<NavigationPanelPreviewFill>
					<TemplatePreview
						rawContent={ hoveredTemplate.content.raw }
					/>
				</NavigationPanelPreviewFill>
			) }
		</>
	);
}
