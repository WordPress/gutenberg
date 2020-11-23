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

	/* eslint-disable camelcase */
	const isRevertable =
		'auto-draft' !== template.status &&
		template?.file_based &&
		currentTheme === template?.wp_theme_slug;
	/* eslint-enable camelcase */

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

			{ isRevertable && (
				<div className="edit-site-template-details">
					<Text variant="body">
						<Button
							isLink
							onClick={ () => revertTemplate( template ) }
						>
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
