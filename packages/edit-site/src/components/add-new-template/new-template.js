/**
 * External dependencies
 */
import { filter, includes, map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	NavigableMenu,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useHistory } from '../routes';

const DEFAULT_TEMPLATE_SLUGS = [
	'front-page',
	'single-post',
	'page',
	'archive',
	'search',
	'404',
	'index',
];

export default function NewTemplate( { postType } ) {
	const history = useHistory();
	const { templates, defaultTemplateTypes } = useSelect(
		( select ) => ( {
			templates: select( coreStore ).getEntityRecords(
				'postType',
				'wp_template',
				{ per_page: -1 }
			),
			defaultTemplateTypes: select(
				editorStore
			).__experimentalGetDefaultTemplateTypes(),
		} ),
		[]
	);
	const { createErrorNotice } = useDispatch( noticesStore );

	async function createTemplate( { slug } ) {
		try {
			// Navigate to the created template editor.
			history.push( {
				// TODO: Compute theme name.
				postId: 'twentytwentytwo//' + slug.toString(),
				postType: 'wp_template',
			} );

			// TODO: Add a success notice?
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the template.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
	}

	const existingTemplateSlugs = map( templates, 'slug' );

	const missingTemplates = filter(
		defaultTemplateTypes,
		( template ) =>
			includes( DEFAULT_TEMPLATE_SLUGS, template.slug ) &&
			! includes( existingTemplateSlugs, template.slug )
	);

	if ( ! missingTemplates.length ) {
		return null;
	}

	return (
		<DropdownMenu
			className="edit-site-new-template-dropdown"
			icon={ null }
			text={ postType.labels.add_new }
			label={ postType.labels.add_new_item }
			popoverProps={ {
				noArrow: false,
			} }
			toggleProps={ {
				variant: 'primary',
			} }
		>
			{ () => (
				<NavigableMenu className="edit-site-new-template-dropdown__popover">
					<MenuGroup label={ postType.labels.add_new_item }>
						{ map(
							missingTemplates,
							( { title, description, slug } ) => (
								<MenuItem
									info={ description }
									key={ slug }
									onClick={ () => {
										createTemplate( { slug } );
										// We will be navigated way so no need to close the dropdown.
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
