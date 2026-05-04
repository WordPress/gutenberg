/**
 * WordPress dependencies
 */
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { isReusableBlock, isTemplatePart } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import __unstableBlockToolbarLastItem from './block-toolbar-last-item';

// Shows an Edit/Done button for any content-only locked block — including
// patterns, which carry `templateLock: 'contentOnly'` after insertion.
// Template parts and synced patterns are entity references with their own
// "Edit original" affordance, so they're excluded.
export default function EditSectionButton() {
	const { clientId, show, isEditingThis } = useSelect( ( select ) => {
		const {
			getSelectedBlockClientIds,
			getBlockName,
			getBlockAttributes,
			canEditBlock,
		} = select( blockEditorStore );

		const ids = getSelectedBlockClientIds();
		if ( ids.length !== 1 ) {
			return { show: false };
		}

		const selectedClientId = ids[ 0 ];
		const blockName = getBlockName( selectedClientId );
		const blockType = blockName ? { name: blockName } : null;

		if ( isReusableBlock( blockType ) || isTemplatePart( blockType ) ) {
			return { show: false };
		}

		if ( ! canEditBlock( selectedClientId ) ) {
			return { show: false };
		}

		// The button is strictly tied to the block's `templateLock` attribute,
		// which stays set during inline editing — `getTemplateLock` only
		// overrides the runtime lock, not the attribute itself.
		const attributes = getBlockAttributes( selectedClientId );
		if ( attributes?.templateLock !== 'contentOnly' ) {
			return { show: false };
		}

		const { getEditedContentOnlySection } = unlock(
			select( blockEditorStore )
		);
		const _isEditingThis =
			getEditedContentOnlySection() === selectedClientId;

		return {
			clientId: selectedClientId,
			show: true,
			isEditingThis: _isEditingThis,
		};
	}, [] );

	const { editContentOnlySection, stopEditingContentOnlySection } = unlock(
		useDispatch( blockEditorStore )
	);

	if ( ! show ) {
		return null;
	}

	return (
		<__unstableBlockToolbarLastItem>
			<ToolbarGroup>
				<ToolbarButton
					onClick={ () => {
						if ( isEditingThis ) {
							stopEditingContentOnlySection();
						} else {
							editContentOnlySection( clientId );
						}
					} }
				>
					{ isEditingThis ? __( 'Done' ) : __( 'Edit' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</__unstableBlockToolbarLastItem>
	);
}
