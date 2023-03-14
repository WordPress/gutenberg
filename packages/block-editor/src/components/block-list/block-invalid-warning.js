/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { createBlock, rawHandler } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Warning from '../warning';
import BlockCompare from '../block-compare';
import { store as blockEditorStore } from '../../store';

const blockToBlocks = ( block ) =>
	rawHandler( {
		HTML: block.originalContent,
	} );

const recoverBlock = ( block ) =>
	createBlock( block.name, block.attributes, block.innerBlocks );

const blockToClassic = ( block ) =>
	createBlock( 'core/freeform', {
		content: block.originalContent,
	} );

const blockToHTML = ( block ) =>
	createBlock( 'core/html', {
		content: block.originalContent,
	} );

export default function BlockInvalidWarning( { clientId } ) {
	const { block, canInsertHTMLBlock, canInsertClassicBlock } = useSelect(
		( select ) => {
			const { canInsertBlockType, getBlock, getBlockRootClientId } =
				select( blockEditorStore );

			const rootClientId = getBlockRootClientId( clientId );

			return {
				block: getBlock( clientId ),
				canInsertHTMLBlock: canInsertBlockType(
					'core/html',
					rootClientId
				),
				canInsertClassicBlock: canInsertBlockType(
					'core/freeform',
					rootClientId
				),
			};
		},
		[ clientId ]
	);
	const { replaceBlock } = useDispatch( blockEditorStore );

	const [ compare, setCompare ] = useState( false );
	const onCompareClose = useCallback( () => setCompare( false ), [] );

	const attemptBlockRecovery = useCallback( () => {
		replaceBlock( block.clientId, recoverBlock( block ) );
	}, [ block, replaceBlock ] );

	const convertToClassic = useCallback( () => {
		replaceBlock( block.clientId, blockToClassic( block ) );
	}, [ block, replaceBlock ] );

	const convertToHTML = useCallback(
		() => replaceBlock( block.clientId, blockToHTML( block ) ),
		[ block, replaceBlock ]
	);

	const convertToBlocks = useCallback(
		() => replaceBlock( block.clientId, blockToBlocks( block ) ),
		[ block, replaceBlock ]
	);

	const secondaryActions = useMemo(
		() =>
			[
				{
					// translators: Button to fix block content
					title: _x( 'Resolve', 'imperative verb' ),
					onClick: () => setCompare( true ),
				},
				canInsertHTMLBlock && {
					title: __( 'Convert to HTML' ),
					onClick: convertToHTML,
				},
				canInsertClassicBlock && {
					title: __( 'Convert to Classic Block' ),
					onClick: convertToClassic,
				},
			].filter( Boolean ),
		[
			canInsertHTMLBlock,
			convertToHTML,
			canInsertClassicBlock,
			convertToClassic,
		]
	);

	return (
		<>
			<Warning
				actions={ [
					<Button
						key="recover"
						onClick={ attemptBlockRecovery }
						variant="primary"
					>
						{ __( 'Attempt Block Recovery' ) }
					</Button>,
				] }
				secondaryActions={ secondaryActions }
			>
				{ __( 'This block contains unexpected or invalid content.' ) }
			</Warning>
			{ compare && (
				<Modal
					title={
						// translators: Dialog title to fix block content
						__( 'Resolve Block' )
					}
					onRequestClose={ onCompareClose }
					className="block-editor-block-compare"
				>
					<BlockCompare
						block={ block }
						onKeep={ convertToHTML }
						onConvert={ convertToBlocks }
						convertor={ blockToBlocks }
						convertButtonText={ __( 'Convert to Blocks' ) }
					/>
				</Modal>
			) }
		</>
	);
}
