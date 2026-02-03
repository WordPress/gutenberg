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

export default function Edit( { context, clientId } ) {
	const dialogId = context[ 'core/dialog-id' ] ?? '';
	const isDialogOpen = context[ 'core/dialog-isDialogOpen' ] ?? false;

	// Get the parent dialog block's clientId
	const { dialogClientId } = useSelect(
		( select ) => {
			return {
				dialogClientId:
					select( blockEditorStore ).getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);

	// Get block editor dispatch for non-persistent updates
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const toggleDialog = () => {
		if ( dialogClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( dialogClientId, {
				editorIsDialogOpen: ! isDialogOpen,
			} );
		}
	};

	const blockProps = useBlockProps( {
		'aria-haspopup': 'dialog',
		'aria-controls': dialogId,
		'aria-expanded': isDialogOpen ? 'true' : 'false',
		type: 'button',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: false,
		__experimentalCaptureToolbars: true,
	} );

	const buttonLabel = useMemo(
		() => ( isDialogOpen ? __( 'Close dialog' ) : __( 'Edit dialog' ) ),
		[ isDialogOpen ]
	);

	return (
		<>
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarGroup>
					<ToolbarButton
						label={ buttonLabel }
						aria-controls={ dialogId }
						onClick={ toggleDialog }
					>
						{ buttonLabel }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<button { ...innerBlocksProps } />
		</>
	);
}
