/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';
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
 * are set. Only renders if all selected blocks support the visibility feature
 * and visibility has been set, or if it has been shown before (to avoid focus loss).
 *
 * @param {Object}   props           Component props.
 * @param {string[]} props.clientIds Array of block client IDs.
 * @return {JSX.Element|null} The toolbar button or null if visibility is not supported or not set.
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

	const hasBlockVisibilityButtonShownRef = useRef( false );

	// If the block visibility button has been shown, we don't want to
	// remove it from the toolbar until the toolbar is rendered again
	// without it. Removing it beforehand can cause focus loss issues.
	// It needs to return focus from whence it came, and to do that,
	// we need to leave the button in the toolbar.
	useEffect( () => {
		if ( hasAnyVisibility ) {
			hasBlockVisibilityButtonShownRef.current = true;
		}
	}, [ hasAnyVisibility ] );

	if ( ! canToggleBlockVisibility ) {
		return null;
	}

	if ( ! hasAnyVisibility && ! hasBlockVisibilityButtonShownRef.current ) {
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
