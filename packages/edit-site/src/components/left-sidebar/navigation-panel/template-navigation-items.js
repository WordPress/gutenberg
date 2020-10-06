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
import { ITEM_CONTENTS } from './constants';

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
				const { title, description } =
					ITEM_CONTENTS[ template.slug ] ?? {};

				return (
					<NavigationItem
						className="edit-site-navigation-panel__template-item"
						key={ `${ itemPrefix }-${ template.id }` }
						item={ `${ itemPrefix }-${ template.slug }` }
						title={ title || template.slug }
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
