/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../dialog/store';

export default function Edit( { context, clientId } ) {
	const dialogId = context[ 'dialog/id' ] ?? null;

	// Get the dialog-element block from the parent dialog block
	const { dialogElementClientId, isDialogOpen } = useSelect(
		( select ) => {
			const { getBlock, getBlockRootClientId } =
				select( blockEditorStore );
			const parentClientId = getBlockRootClientId( clientId );
			const parentBlock = getBlock( parentClientId );

			// Find the dialog-element block in the parent's inner blocks
			const dialogElementBlock = parentBlock?.innerBlocks?.find(
				( innerBlock ) => innerBlock.name === 'core/dialog-element'
			);
			const dialogElementId = dialogElementBlock?.clientId;

			return {
				dialogElementClientId: dialogElementId,
				isDialogOpen: dialogElementId
					? select( STORE_NAME ).isOpen( dialogElementId )
					: false,
			};
		},
		[ clientId ]
	);

	// Get store actions
	const { open, close } = useDispatch( STORE_NAME );

	const blockProps = useBlockProps( {
		'aria-haspopup': 'dialog',
		'aria-controls': dialogId,
		'aria-expanded': isDialogOpen ? 'true' : 'false',
		type: 'button',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: false,
	} );

	const buttonLabel = useMemo(
		() => ( isDialogOpen ? __( 'Close Dialog' ) : __( 'Edit Dialog' ) ),
		[ isDialogOpen ]
	);

	return (
		<>
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarGroup>
					<ToolbarButton
						label={ buttonLabel }
						onClick={ () => {
							if ( ! dialogElementClientId ) {
								return;
							}
							if ( isDialogOpen ) {
								close( dialogElementClientId );
							} else {
								open( dialogElementClientId );
							}
						} }
					>
						{ buttonLabel }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<button { ...innerBlocksProps } />
		</>
	);
}
