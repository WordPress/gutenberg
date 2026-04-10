/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { seen, unseen } from '@wordpress/icons';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function BlockVisibilityViewportToolbar( { clientIds } ) {
	const {
		canToggleBlockVisibility,
		areBlocksHiddenAnywhere,
		isViewportModalOpenForSelection,
	} = useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getBlockName,
				isBlockHiddenAnywhere,
				getViewportModalClientIds,
			} = unlock( select( blockEditorStore ) );
			const _blocks = getBlocksByClientId( clientIds );
			const viewportModalClientIds = getViewportModalClientIds();
			return {
				canToggleBlockVisibility: _blocks.every( ( { clientId } ) =>
					hasBlockSupport(
						getBlockName( clientId ),
						'visibility',
						true
					)
				),
				areBlocksHiddenAnywhere: clientIds?.every( ( clientId ) =>
					isBlockHiddenAnywhere( clientId )
				),
				isViewportModalOpenForSelection:
					Array.isArray( viewportModalClientIds ) &&
					Array.isArray( clientIds ) &&
					viewportModalClientIds.length === clientIds.length &&
					viewportModalClientIds.every( ( modalClientId ) =>
						clientIds.includes( modalClientId )
					),
			};
		},

		[ clientIds ]
	);
	const blockEditorDispatch = useDispatch( blockEditorStore );

	if ( ! areBlocksHiddenAnywhere && ! isViewportModalOpenForSelection ) {
		return null;
	}

	const { showViewportModal } = unlock( blockEditorDispatch );

	return (
		<ToolbarGroup className="block-editor-block-visibility-toolbar">
			<ToolbarButton
				disabled={ ! canToggleBlockVisibility }
				icon={ areBlocksHiddenAnywhere ? unseen : seen }
				label={
					areBlocksHiddenAnywhere ? __( 'Hidden' ) : __( 'Visible' )
				}
				onClick={ () => showViewportModal( clientIds ) }
				aria-haspopup="dialog"
			/>
		</ToolbarGroup>
	);
}
