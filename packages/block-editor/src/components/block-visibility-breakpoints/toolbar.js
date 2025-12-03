/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { hasBlockSupport } from '@wordpress/blocks';
import { seen, unseen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockVisibilityBreakpointsModal from './modal';

export default function BlockVisibilityBreakpointsToolbar( {
	clientIds,
} ) {
	const { blocks, canToggleBlockVisibility } = useSelect(
		( select ) => {
			const { getBlockName, getBlocksByClientId } =
				select( blockEditorStore );
			const _blocks = getBlocksByClientId( clientIds );
			return {
				blocks: _blocks,
				canToggleBlockVisibility: _blocks.every( ( { clientId } ) =>
					hasBlockSupport(
						getBlockName( clientId ),
						'visibility',
						true
					)
				),
			};
		},
		[ clientIds ]
	);

	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const hasBreakpointVisibility = blocks.some(
		( block ) =>
			block.attributes.metadata?.blockVisibilityBreakpoints &&
			( block.attributes.metadata.blockVisibilityBreakpoints.mobile ||
				block.attributes.metadata.blockVisibilityBreakpoints.tablet ||
				block.attributes.metadata.blockVisibilityBreakpoints.desktop )
	);

	if ( ! canToggleBlockVisibility ) {
		return null;
	}

	return (
		<>
			<ToolbarGroup className="block-editor-block-visibility-breakpoints-toolbar">
				<ToolbarButton
					icon={ hasBreakpointVisibility ? unseen : seen }
					label={
						hasBreakpointVisibility
							? __( 'Breakpoint visibility set' )
							: __( 'Set breakpoint visibility' )
					}
					onClick={ () => setIsModalOpen( true ) }
				/>
			</ToolbarGroup>
			{ isModalOpen && (
				<BlockVisibilityBreakpointsModal
					clientIds={ clientIds }
					onClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}

