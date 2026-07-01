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

export default function BlockInvalidWarning( { clientId } ) {
	const { block, canInsertHTMLBlock } = useSelect(
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
			};
		},
		[ clientId ]
	);
	const { replaceBlock } = useDispatch( blockEditorStore );

	const [ compare, setCompare ] = useState( false );
	const onCompareClose = useCallback( () => setCompare( false ), [] );

	const convert = useMemo(
		() => ( {
			toHTML() {
				const htmlBlock = createBlock(
					'core/html',
					{},
					[],
					[ block.originalContent ]
				);
				return replaceBlock( block.clientId, htmlBlock );
			},
			toBlocks() {
				const newBlocks = blockToBlocks( block );
				return replaceBlock( block.clientId, newBlocks );
			},
			toRecoveredBlock() {
				const recoveredBlock = createBlock(
					block.name,
					block.attributes,
					block.innerBlocks
				);
				return replaceBlock( block.clientId, recoveredBlock );
			},
		} ),
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
					onClick: convert.toHTML,
				},
			].filter( Boolean ),
		[ canInsertHTMLBlock, convert ]
	);

	return (
		<>
			<Warning
				actions={ [
					<Button
						__next40pxDefaultSize
						key="recover"
						onClick={ convert.toRecoveredBlock }
						variant="primary"
					>
						{ __( 'Attempt recovery' ) }
					</Button>,
				] }
				secondaryActions={ secondaryActions }
			>
				{ __( 'Block contains unexpected or invalid content.' ) }
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
						onKeep={ convert.toHTML }
						onConvert={ convert.toBlocks }
						convertor={ blockToBlocks }
						convertButtonText={ __( 'Convert to Blocks' ) }
					/>
				</Modal>
			) }
		</>
	);
}
