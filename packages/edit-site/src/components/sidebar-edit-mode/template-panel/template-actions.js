/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { parse } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import isTemplateRevertable from '../../../utils/is-template-revertable';
import ReplaceTemplateButton from './replace-template-button';
import { unlock } from '../../../lock-unlock';
import { PATTERN_CORE_SOURCES, PATTERN_TYPES } from '../../../utils/constants';

export default function Actions( { template } ) {
	// This is duplicated.
	const filterOutDuplicatesByName = ( currentItem, index, items ) =>
		index === items.findIndex( ( item ) => currentItem.name === item.name );

	const selectAvailablePatterns = ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		const settings = getSettings();
		const blockPatterns =
			settings.__experimentalAdditionalBlockPatterns ??
			settings.__experimentalBlockPatterns;

		const restBlockPatterns = select( coreStore ).getBlockPatterns();

		const patterns = [
			...( blockPatterns || [] ),
			...( restBlockPatterns || [] ),
		]
			.filter(
				( pattern ) => ! PATTERN_CORE_SOURCES.includes( pattern.source )
			)
			.filter( filterOutDuplicatesByName )
			// TODO use the correct type.
			.filter( ( pattern ) => pattern.templateTypes?.includes( 'home' ) )
			.map( ( pattern ) => ( {
				...pattern,
				keywords: pattern.keywords || [],
				type: PATTERN_TYPES.theme,
				blocks: parse( pattern.content, {
					__unstableSkipMigrationLogs: true,
				} ),
			} ) );

		return patterns;
	};
	// Should we also get templates?
	const availableTemplates = useSelect( selectAvailablePatterns );
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
