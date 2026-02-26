/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';

export default function EditSectionButton( { clientId } ) {
	const {
		isSectionBlock,
		isEditingContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	} = useContentOnlySectionEdit( clientId );

	const { blockName } = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return { blockName: null };
			}
			const { getBlockName } = select( blockEditorStore );
			return {
				blockName: getBlockName( clientId ),
			};
		},
		[ clientId ]
	);
	const blockType = blockName ? { name: blockName } : null;

	// Don't show for synced patterns or template parts — they already have
	// their own toolbar buttons ("Edit original").
	// Note: isSectionBlock returns false while the section is being edited,
	// so we also check isEditingContentOnlySection to show "Exit pattern".
	if (
		! clientId ||
		( ! isSectionBlock && ! isEditingContentOnlySection ) ||
		isReusableBlock( blockType ) ||
		isTemplatePart( blockType )
	) {
		return null;
	}

	const isEditing = isEditingContentOnlySection;

	const handleClick = () => {
		if ( isEditing ) {
			stopEditingContentOnlySection();
		} else {
			editContentOnlySection( clientId );
		}
	};

	return (
		<ToolbarGroup>
			<ToolbarButton onClick={ handleClick }>
				{ isEditing ? __( 'Exit pattern' ) : __( 'Edit pattern' ) }
			</ToolbarButton>
		</ToolbarGroup>
	);
}
