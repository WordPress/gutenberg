/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	MenuItem,
	__experimentalText as Text,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import isTemplateRevertable from '../../utils/is-template-revertable';
import { MENU_TEMPLATES } from '../navigation-sidebar/navigation-panel/constants';
import { store as editSiteStore } from '../../store';

export default function TemplateDetails( { template, onClose } ) {
	const { title, description } = useSelect(
		( select ) =>
			select( 'core/editor' ).__experimentalGetTemplateInfo( template ),
		[]
	);
	const { openNavigationPanelToMenu, revertTemplate } = useDispatch(
		editSiteStore
	);

	if ( ! template ) {
		return null;
	}

	const showTemplateInSidebar = () => {
		onClose();
		openNavigationPanelToMenu( MENU_TEMPLATES );
	};

	const revert = () => {
		revertTemplate( template );
		onClose();
	};

	return (
		<>
			<div className="edit-site-template-details">
				<Text size="body" weight={ 600 }>
					{ title }
				</Text>

				{ description && (
					<Text
						size="body"
						className="edit-site-template-details__description"
					>
						{ description }
					</Text>
				) }
			</div>

			{ isTemplateRevertable( template ) && (
				<div className="edit-site-template-details__revert">
					<MenuItem
						info={ __( 'Restore template to theme default' ) }
						onClick={ revert }
					>
						{ __( 'Clear customizations' ) }
					</MenuItem>
				</div>
			) }

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
