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

	const blockType = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return null;
			}
			const { getBlockName } = select( blockEditorStore );
			const blockName = getBlockName( clientId );
			return blockName ? { name: blockName } : null;
		},
		[ clientId ]
	);

	const isEditing = isEditingContentOnlySection;

	if (
		! clientId ||
		( ! isSectionBlock && ! isEditing ) ||
		isReusableBlock( blockType ) ||
		isTemplatePart( blockType )
	) {
		return null;
	}

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
				{ isEditing ? __( 'Done' ) : __( 'Edit' ) }
			</ToolbarButton>
		</ToolbarGroup>
	);
}
