/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, __experimentalText as Text } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MENU_TEMPLATES } from '../navigation-sidebar/navigation-panel/constants';
import { store as editSiteStore } from '../../store';

export default function TemplateDetails( { template, onClose } ) {
	const { title, description } = useSelect(
		( select ) =>
			select( 'core/editor' ).__experimentalGetTemplateInfo( template ),
		[]
	);
	const { openNavigationPanelToMenu } = useDispatch( editSiteStore );

	if ( ! template ) {
		return null;
	}

	const showTemplateInSidebar = () => {
		onClose();
		openNavigationPanelToMenu( MENU_TEMPLATES );
	};

	return (
		<>
			<div className="edit-site-template-details">
				<Text variant="sectionheading">
					{ __( 'Template details' ) }
				</Text>

				{ title && (
					<Text variant="body">
						{ sprintf(
							/* translators: %s: Name of the template. */
							__( 'Name: %s' ),
							title
						) }
					</Text>
				) }

				{ description && (
					<Text variant="body">
						{ sprintf(
							/* translators: %s: Description of the template. */
							__( 'Description: %s' ),
							description
						) }
					</Text>
				) }
			</div>

			<Button
				className="edit-site-template-details__show-all-button"
				onClick={ showTemplateInSidebar }
				aria-label={ __(
					'Browse all templates. This will open the template menu in the navigation side panel.'
				) }
			>
				{ __( 'Browse all templates' ) }
			</Button>
		</>
	);
}
