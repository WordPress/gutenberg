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
import { TEMPLATES_DEFAULT_DETAILS } from './constants';

export default function TemplateNavigationItems( {
	entityType = 'wp_template',
	templates,
	onActivateItem,
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

	return (
		<>
			{ templates.map( ( template ) => {
				const { title: defaultTitle, description: defaultDescription } =
					TEMPLATES_DEFAULT_DETAILS[ template.slug ] ?? {};
				const key = `${ entityType }-${ template.id }`;

				let title = template?.title?.rendered ?? template.slug;
				if ( title !== template.slug ) {
					title = template.title.rendered;
				} else if ( defaultTitle ) {
					title = defaultTitle;
				}

				const description =
					template?.excerpt?.rendered || defaultDescription;

				return (
					<NavigationItem
						className="edit-site-navigation-panel__template-item"
						key={ key }
						item={ key }
						title={ title }
					>
						<Button
							onClick={ () => onActivateItem( template.id ) }
							onMouseEnter={ () =>
								onMouseEnterTemplate( template )
							}
							onMouseLeave={ onMouseLeaveTemplate }
						>
							{ title }
							{ description && (
								<div className="edit-site-navigation-panel__template-item-description">
									{ description }
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
