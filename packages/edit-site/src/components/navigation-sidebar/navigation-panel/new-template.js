/**
 * External dependencies
 */
import { find, map } from 'lodash';

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
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { TEMPLATES_DEFAULT_DETAILS } from '../../../utils/get-template-info/constants';

export default function NewTemplate() {
	const templates = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template', {
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
			} ),
		[]
	);
	const { addTemplate } = useDispatch( 'core/edit-site' );

	const createTemplate = ( slug ) =>
		addTemplate( {
			slug,
			title: slug,
			status: 'publish',
		} );

	return (
		<DropdownMenu
			icon={ plus }
			label={ __( 'Add Template' ) }
			popoverProps={ {
				className: 'edit-site-navigation-panel__new-template',
				noArrow: false,
			} }
			toggleProps={ { isSmall: true, isTertiary: true } }
		>
			{ ( { onClose } ) => (
				<NavigableMenu>
					<MenuGroup label={ __( 'Add Template' ) }>
						{ map(
							TEMPLATES_DEFAULT_DETAILS,
							( { title, description }, slug ) => (
								<MenuItem
									disabled={ !! find( templates, { slug } ) }
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
