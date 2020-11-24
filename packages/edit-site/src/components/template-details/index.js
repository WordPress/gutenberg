/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, __experimentalText as Text } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isTemplateRevertable } from '../../utils';
import { MENU_TEMPLATES } from '../navigation-sidebar/navigation-panel/constants';

export default function TemplateDetails( { template, onClose } ) {
	const { title, description, currentTheme } = useSelect( ( select ) => {
		const templateInfo = select(
			'core/editor'
		).__experimentalGetTemplateInfo( template );
		return {
			title: templateInfo?.title,
			description: templateInfo?.description,
			currentTheme: select( 'core' ).getCurrentTheme()?.stylesheet,
		};
	}, [] );
	const { openNavigationPanelToMenu, revertTemplate } = useDispatch(
		'core/edit-site'
	);

	if ( ! template ) {
		return null;
	}

	const revert = () => {
		revertTemplate( template );
		onClose();
	};

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

			{ isTemplateRevertable( template, currentTheme ) && (
				<div className="edit-site-template-details">
					<Text variant="body">
						<Button isLink onClick={ revert }>
							{ __( 'Revert' ) }
						</Button>
						<br />
						{ __(
							'Reset this template to the theme supplied default'
						) }
					</Text>
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
