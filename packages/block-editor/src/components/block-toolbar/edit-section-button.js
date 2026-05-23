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

	if (
		! clientId ||
		( ! isSectionBlock && ! isEditingContentOnlySection ) ||
		isReusableBlock( blockType ) ||
		isTemplatePart( blockType )
	) {
		return null;
	}

	return (
		<BlockControls group="other">
			<ToolbarButton
				onClick={ () => {
					if ( isEditingContentOnlySection ) {
						stopEditingContentOnlySection();
					} else {
						editContentOnlySection( clientId );
					}
				} }
			>
				{ isEditingContentOnlySection ? __( 'Done' ) : __( 'Edit' ) }
			</ToolbarButton>
		</BlockControls>
	);
}
