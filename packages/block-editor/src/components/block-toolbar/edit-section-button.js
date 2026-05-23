/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockControls from '../block-controls';
import useContentOnlySectionEdit from '../../hooks/use-content-only-section-edit';

export default function EditSectionButton( { clientId } ) {
	const {
		isSectionBlock,
		parentSectionBlock,
		isWithinSection,
		isWithinEditedSection,
		isEditingContentOnlySection,
		editedContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	} = useContentOnlySectionEdit( clientId );

	const sectionClientId =
		( isSectionBlock && clientId ) ||
		parentSectionBlock ||
		( isWithinEditedSection && editedContentOnlySection );

	const blockType = useSelect(
		( select ) => {
			if ( ! sectionClientId ) {
				return null;
			}
			const { getBlockName } = select( blockEditorStore );
			const blockName = getBlockName( sectionClientId );
			return blockName ? { name: blockName } : null;
		},
		[ sectionClientId ]
	);

	const isEditing = isEditingContentOnlySection || isWithinEditedSection;

	if (
		! sectionClientId ||
		( ! isWithinSection && ! isEditing ) ||
		isReusableBlock( blockType ) ||
		isTemplatePart( blockType )
	) {
		return null;
	}

	const handleClick = () => {
		if ( isEditing ) {
			stopEditingContentOnlySection();
		} else {
			editContentOnlySection( sectionClientId );
		}
	};

	return (
		<BlockControls group="other">
			<ToolbarButton onClick={ handleClick }>
				{ isEditing ? __( 'Done' ) : __( 'Edit' ) }
			</ToolbarButton>
		</BlockControls>
	);
}
