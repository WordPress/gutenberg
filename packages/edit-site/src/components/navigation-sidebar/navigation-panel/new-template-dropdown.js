/**
 * External dependencies
 */
import { map, omit, reduce } from 'lodash';

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
import {
	TEMPLATES_DEFAULT_DETAILS,
	TEMPLATES_DEFAULT_ORDER,
} from '../../../utils/get-template-info/constants';

export default function NewTemplateDropdown() {
	const templates = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template', {
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
			} ),
		[]
	);
	const { addTemplate } = useDispatch( 'core/edit-site' );

	const createTemplate = ( slug ) => {
		const closestAvailableTemplate = getClosestAvailableTemplate(
			slug,
			templates
		);
		addTemplate( {
			content: closestAvailableTemplate.content.raw,
			slug,
			title: slug,
			status: 'draft',
		} );
	};

	const missingTemplates = omit(
		TEMPLATES_DEFAULT_DETAILS,
		map( templates, 'slug' )
	);

	const orderedMissingTemplates = reduce(
		TEMPLATES_DEFAULT_ORDER,
		( result = [], slug ) => {
			if ( missingTemplates[ slug ] ) {
				const template = missingTemplates[ slug ];
				template.slug = slug;
				result.push( template );
			}
			return result;
		}
	);

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
				<NavigableMenu>
					<MenuGroup label={ __( 'Add Template' ) }>
						{ map(
							orderedMissingTemplates,
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
