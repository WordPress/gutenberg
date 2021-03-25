/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
				<Text variant="subtitle">{ title }</Text>

				{ description && (
					<Text
						variant="body"
						className="edit-site-template-details__description"
					>
						{ description }
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
