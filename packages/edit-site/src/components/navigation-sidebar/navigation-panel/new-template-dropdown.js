/**
 * External dependencies
 */
import { filter, find, includes, map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	NavigableMenu,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import getClosestAvailableTemplate from '../../../utils/get-closest-available-template';
import { TEMPLATES_NEW_OPTIONS } from './constants';
import { store as editSiteStore } from '../../../store';

export default function NewTemplateDropdown() {
	const { defaultTemplateTypes, templates } = useSelect( ( select ) => {
		const {
			__experimentalGetDefaultTemplateTypes: getDefaultTemplateTypes,
		} = select( 'core/editor' );
		const templateEntities = select( 'core' ).getEntityRecords(
			'postType',
			'wp_template'
		);
		return {
			defaultTemplateTypes: getDefaultTemplateTypes(),
			templates: templateEntities,
		};
	}, [] );
	const { addTemplate } = useDispatch( editSiteStore );

	const createTemplate = ( slug ) => {
		const closestAvailableTemplate = getClosestAvailableTemplate(
			slug,
			templates
		);
		const { title, description } = find( defaultTemplateTypes, { slug } );
		addTemplate( {
			content: closestAvailableTemplate.content.raw,
			excerpt: description,
			// Slugs need to be strings, so this is for template `404`
			slug: slug.toString(),
			status: 'draft',
			title,
		} );
	};

	const existingTemplateSlugs = map( templates, 'slug' );

	const missingTemplates = filter(
		defaultTemplateTypes,
		( template ) =>
			includes( TEMPLATES_NEW_OPTIONS, template.slug ) &&
			! includes( existingTemplateSlugs, template.slug )
	);

	if ( ! missingTemplates.length ) {
		return null;
	}

	return (
		<DropdownMenu
			className="edit-site-navigation-panel__new-template-dropdown"
			icon={ null }
			label={ __( 'Add Template' ) }
			popoverProps={ {
				noArrow: false,
			} }
			toggleProps={ {
				children: <Icon icon={ plus } />,
				isSmall: true,
				isTertiary: true,
			} }
		>
			{ ( { onClose } ) => (
				<NavigableMenu className="edit-site-navigation-panel__new-template-popover">
					<MenuGroup label={ __( 'Add Template' ) }>
						{ map(
							missingTemplates,
							( { title, description, slug } ) => (
								<MenuItem
									info={ description }
									key={ slug }
									onClick={ () => {
										createTemplate( slug );
										onClose();
									} }
								>
									{ title }
								</MenuItem>
							)
						) }
					</MenuGroup>
				</NavigableMenu>
			) }
		</DropdownMenu>
	);
}
