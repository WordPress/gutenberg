/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';
import { store as blockEditorStore } from '../../store';

export function EditSectionMenuItem( { clientId, onClose } ) {
	const {
		isSectionBlock,
		isEditingContentOnlySection,
		editContentOnlySection,
	} = useContentOnlySectionEdit( clientId );

	const { block, onNavigateToEntityRecord } = useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			return {
				block: getBlock( clientId ),
				onNavigateToEntityRecord:
					getSettings().onNavigateToEntityRecord,
			};
		},
		[ clientId ]
	);

	// Only show when the experiment is enabled, the block is a section block,
	// and we're not already editing it
	if (
		! window?.__experimentalContentOnlyPatternInsertion ||
		! isSectionBlock ||
		isEditingContentOnlySection
	) {
		return null;
	}

	const blockAttributes = block?.attributes || {};

	// Synced patterns and template parts should navigate to the isolated editor
	const isSyncedPattern = isReusableBlock( block );
	const isTemplatePartBlock = isTemplatePart( block );
	const shouldNavigateToIsolatedEditor =
		( isSyncedPattern || isTemplatePartBlock ) && onNavigateToEntityRecord;

	const handleClick = () => {
		if ( shouldNavigateToIsolatedEditor ) {
			// Navigate to isolated editor for synced patterns and template parts
			if ( isSyncedPattern ) {
				onNavigateToEntityRecord( {
					postId: blockAttributes.ref,
					postType: 'wp_block',
				} );
			} else if ( isTemplatePartBlock ) {
				const { theme, slug } = blockAttributes;
				const templatePartId =
					theme && slug ? `${ theme }//${ slug }` : null;
				if ( templatePartId ) {
					onNavigateToEntityRecord( {
						postId: templatePartId,
						postType: 'wp_template_part',
					} );
				}
			}
		} else {
			// Use spotlight mode for unsynced patterns
			editContentOnlySection( clientId );
		}
		onClose();
	};

	return (
		<MenuItem onClick={ handleClick }>
			{ _x( 'Edit section', 'Editing a section in the Editor' ) }
		</MenuItem>
	);
}
