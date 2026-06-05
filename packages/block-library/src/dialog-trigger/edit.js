/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { lock, unlock } from '@wordpress/icons';
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

const TEMPLATE = [
	[
		'core/buttons',
		{},
		[
			[
				'core/button',
				{
					text: __( 'Open dialog' ),
					tagName: 'button',
				},
			],
		],
	],
];

export default function Edit( { context, clientId } ) {
	const dialogId = context[ 'core/dialog-id' ] ?? '';
	const isDialogOpen = context[ 'core/dialog-isDialogOpen' ] ?? false;
	const isDialogLocked = context[ 'core/dialog-isDialogLocked' ] ?? false;

	const { dialogClientId } = useSelect(
		( select ) => ( {
			dialogClientId:
				select( blockEditorStore ).getBlockRootClientId( clientId ),
		} ),
		[ clientId ]
	);

	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const toggleDialog = () => {
		if ( dialogClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( dialogClientId, {
				editorIsDialogOpen: ! isDialogOpen,
				// Clear the lock whenever the trigger explicitly closes the dialog.
				...( isDialogOpen && { editorIsDialogLocked: false } ),
			} );
		}
	};

	const toggleLock = () => {
		if ( dialogClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( dialogClientId, {
				editorIsDialogLocked: ! isDialogLocked,
			} );
		}
	};

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		templateLock: 'insert',
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
					{ isDialogOpen && (
						<ToolbarButton
							icon={ isDialogLocked ? lock : unlock }
							label={
								isDialogLocked
									? __( 'Unlock dialog' )
									: __( 'Lock dialog open' )
							}
							isPressed={ isDialogLocked }
							onClick={ toggleLock }
						/>
					) }
				</ToolbarGroup>
			</BlockControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
