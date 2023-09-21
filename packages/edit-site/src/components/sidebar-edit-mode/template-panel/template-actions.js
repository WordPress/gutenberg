/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import isTemplateRevertable from '../../../utils/is-template-revertable';
import ReplaceTemplateButton from './replace-template-button';
import { useAvailablePatterns } from '../page-panels/hooks';
export default function Actions( { template } ) {
	const availablePatterns = useAvailablePatterns( template );
	const availableTemplates = availablePatterns.map( ( pattern ) => {
		return {
			name: pattern.name,
			blocks: pattern.blocks,
			title: pattern.title,
			content: pattern.content,
		};
	} );
	const { revertTemplate } = useDispatch( editSiteStore );
	const isRevertable = isTemplateRevertable( template );

	if ( ! isRevertable && availableTemplates.length === 0 ) {
		return null;
	}

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			className="edit-site-template-card__actions"
			toggleProps={ { isSmall: true } }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ isRevertable && (
						<MenuItem
							info={ __(
								'Use the template as supplied by the theme.'
							) }
							onClick={ () => {
								revertTemplate( template );
								onClose();
							} }
						>
							{ __( 'Clear customizations' ) }
						</MenuItem>
					) }
					{ availableTemplates.length > 0 && (
						<ReplaceTemplateButton
							availableTemplates={ availableTemplates }
							template={ template }
							onClick={ onClose }
						/>
					) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
