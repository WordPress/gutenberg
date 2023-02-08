/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	MenuGroup,
	MenuItem,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import isTemplateRevertable from '../../utils/is-template-revertable';
import { store as editSiteStore } from '../../store';
import TemplateAreas from './template-areas';
import EditTemplateTitle from './edit-template-title';
import { useLink } from '../routes/link';
import TemplatePartAreaSelector from './template-part-area-selector';

export default function TemplateDetails( { template, onClose } ) {
	const { title, description } = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetTemplateInfo( template ),
		[]
	);
	const { revertTemplate } = useDispatch( editSiteStore );

	const browseAllLinkProps = useLink( {
		// TODO: We should update this to filter by template part's areas as well.
		postType: template.type,
		postId: undefined,
	} );

	const isTemplatePart = template.type === 'wp_template_part';

	// Only user-created and non-default templates can change the name.
	// But any user-created template part can be renamed.
	const canEditTitle = isTemplatePart
		? ! template.has_theme_file
		: template.is_custom && ! template.has_theme_file;

	if ( ! template ) {
		return null;
	}

	const revert = () => {
		revertTemplate( template );
		onClose();
	};

	return (
		<div className="edit-site-template-details">
			<VStack className="edit-site-template-details__group" spacing={ 3 }>
				{ canEditTitle ? (
					<EditTemplateTitle template={ template } />
				) : (
					<Text
						size={ 16 }
						weight={ 600 }
						className="edit-site-template-details__title"
						as="p"
					>
						{ decodeEntities( title ) }
					</Text>
				) }

				{ description && (
					<Text
						size="body"
						className="edit-site-template-details__description"
						as="p"
					>
						{ decodeEntities( description ) }
					</Text>
				) }
			</VStack>

			{ isTemplatePart && (
				<div className="edit-site-template-details__group">
					<TemplatePartAreaSelector id={ template.id } />
				</div>
			) }

			<TemplateAreas closeTemplateDetailsDropdown={ onClose } />

			{ isTemplateRevertable( template ) && (
				<MenuGroup className="edit-site-template-details__group edit-site-template-details__revert">
					<MenuItem
						className="edit-site-template-details__revert-button"
						info={ __(
							'Use the template as supplied by the theme.'
						) }
						onClick={ revert }
					>
						{ __( 'Clear customizations' ) }
					</MenuItem>
				</MenuGroup>
			) }

			<Button
				className="edit-site-template-details__show-all-button"
				{ ...browseAllLinkProps }
			>
				{ template?.type === 'wp_template'
					? __( 'Browse all templates' )
					: __( 'Browse all template parts' ) }
			</Button>
		</div>
	);
}
