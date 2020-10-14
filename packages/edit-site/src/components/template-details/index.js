/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getTemplateInfo } from '../../utils';
import { MENU_TEMPLATES } from '../left-sidebar/navigation-panel/constants';

export default function TemplateDetails( { template, onClose } ) {
	const { openNavigationPanelToMenu } = useDispatch( 'core/edit-site' );
	if ( ! template ) {
		return null;
	}

	const { title, description } = getTemplateInfo( template );

	const showTemplateInSidebar = () => {
		onClose();
		openNavigationPanelToMenu( MENU_TEMPLATES );
	};

	return (
		<>
			<div className="edit-site-template-details">
				<p className="edit-site-template-details__heading">
					{ __( 'Template details' ) }
				</p>

				{ title && (
					<p>
						{ sprintf(
							/* translators: %s: Name of the template. */
							__( 'Name: %s' ),
							title
						) }
					</p>
				) }
				{ description && (
					<p>
						{ sprintf(
							/* translators: %s: Description of the template. */
							__( 'Description: %s' ),
							description
						) }
					</p>
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
