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
				</ToolbarGroup>
			</BlockControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
