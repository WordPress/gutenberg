/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import {
	Button,
	MenuGroup,
	MenuItem,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import isTemplateRevertable from '../../utils/is-template-revertable';
import {
	MENU_TEMPLATES,
	TEMPLATE_PARTS_SUB_MENUS,
} from '../navigation-sidebar/navigation-panel/constants';
import { store as editSiteStore } from '../../store';
import TemplateAreas from './template-areas';
import EditTemplateTitle from './edit-template-title';

export default function TemplateDetails( { template, onClose } ) {
	const { title, description } = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetTemplateInfo( template ),
		[]
	);
	const { revertTemplate } = useDispatch( editSiteStore );

	const templateSubMenu = useMemo( () => {
		if ( template?.type === 'wp_template' ) {
			return { title: __( 'templates' ), menu: MENU_TEMPLATES };
		}

		return TEMPLATE_PARTS_SUB_MENUS.find(
			( { area } ) => area === template?.area
		);
	}, [ template ] );

	if ( ! template ) {
		return null;
	}

	const revert = () => {
		revertTemplate( template );
		onClose();
	};

	return (
		<div className="edit-site-template-details">
			<div className="edit-site-template-details__group">
				{ template.is_custom ? (
					<EditTemplateTitle template={ template } />
				) : (
					<Heading
						level={ 4 }
						weight={ 600 }
						className="edit-site-template-details__title"
					>
						{ title }
					</Heading>
				) }

				{ description && (
					<Text
						size="body"
						className="edit-site-template-details__description"
						as="p"
					>
						{ description }
					</Text>
				) }
			</div>

			<TemplateAreas closeTemplateDetailsDropdown={ onClose } />

			{ isTemplateRevertable( template ) && (
				<MenuGroup className="edit-site-template-details__group edit-site-template-details__revert">
					<MenuItem
						className="edit-site-template-details__revert-button"
						info={ __( 'Restore template to theme default' ) }
						onClick={ revert }
					>
						{ __( 'Clear customizations' ) }
					</MenuItem>
				</MenuGroup>
			) }

			<Button
				className="edit-site-template-details__show-all-button"
				href={ addQueryArgs( window.location.href, {
					// TODO: We should update this to filter by template part's areas as well.
					postId: undefined,
					postType: template.type,
				} ) }
			>
				{ sprintf(
					/* translators: the template part's area name ("Headers", "Sidebars") or "templates". */
					__( 'Browse all %s' ),
					templateSubMenu.title
				) }
			</Button>
		</div>
	);
}
