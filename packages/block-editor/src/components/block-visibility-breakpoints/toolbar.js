/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { hasBlockSupport } from '@wordpress/blocks';
import { seen, unseen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockVisibilityBreakpointsModal from './modal';
import { hasAnyBreakpointVisibility } from './constants';

/**
 * Toolbar button component for accessing block visibility breakpoints modal.
 *
 * Displays different icons (seen/unseen) based on whether visibility restrictions
 * are set. Only renders if all selected blocks support the visibility feature.
 *
 * @param {Object}   props           Component props.
 * @param {string[]} props.clientIds Array of block client IDs.
 * @return {JSX.Element|null} The toolbar button or null if visibility is not supported.
 */
export default function BlockVisibilityBreakpointsToolbar( { clientIds } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { blocks, canToggleBlockVisibility } = useSelect(
		( select ) => {
			const { getBlockName, getBlocksByClientId } =
				select( blockEditorStore );
			const _blocks = getBlocksByClientId( clientIds );
			return {
				blocks: _blocks,
				canToggleBlockVisibility: _blocks.every(
					( block ) =>
						block &&
						hasBlockSupport(
							getBlockName( block.clientId ),
							'visibility',
							true
						)
				),
			};
		},
		[ clientIds ]
	);

	const hasBreakpointVisibility = blocks.some(
		( block ) =>
			block &&
			hasAnyBreakpointVisibility(
				block.attributes.metadata?.blockVisibilityBreakpoints
			)
	);

	const hasHiddenEverywhere = blocks.some(
		( block ) =>
			block && block.attributes.metadata?.blockVisibility === false
	);

	const hasAnyVisibility = hasBreakpointVisibility || hasHiddenEverywhere;

	if ( ! canToggleBlockVisibility ) {
		return null;
	}

	return (
		<>
			<ToolbarGroup className="block-editor-block-visibility-breakpoints-toolbar">
				<ToolbarButton
					icon={ hasAnyVisibility ? unseen : seen }
					label={
						hasAnyVisibility
							? __( 'Breakpoint visibility set' )
							: __( 'Set breakpoint visibility' )
					}
					onClick={ () => setIsModalOpen( true ) }
					aria-expanded={ isModalOpen }
					aria-haspopup="dialog"
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
