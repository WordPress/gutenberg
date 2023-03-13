/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { getBlockType, createBlock, rawHandler } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Warning from '../warning';
import BlockCompare from '../block-compare';
import { store as blockEditorStore } from '../../store';

export function BlockInvalidWarning( {
	convertToHTML,
	convertToBlocks,
	convertToClassic,
	attemptBlockRecovery,
	block,
} ) {
	const hasHTMLBlock = !! getBlockType( 'core/html' );
	const [ compare, setCompare ] = useState( false );

	const onCompare = useCallback( () => setCompare( true ), [] );
	const onCompareClose = useCallback( () => setCompare( false ), [] );

	// We memo the array here to prevent the children components from being updated unexpectedly.
	const hiddenActions = useMemo(
		() =>
			[
				{
					// translators: Button to fix block content
					title: _x( 'Resolve', 'imperative verb' ),
					onClick: onCompare,
				},
				hasHTMLBlock && {
					title: __( 'Convert to HTML' ),
					onClick: convertToHTML,
				},
				{
					title: __( 'Convert to Classic Block' ),
					onClick: convertToClassic,
				},
			].filter( Boolean ),
		[ onCompare, convertToHTML, convertToClassic ]
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
				secondaryActions={ hiddenActions }
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

const blockToClassic = ( block ) =>
	createBlock( 'core/freeform', {
		content: block.originalContent,
	} );
const blockToHTML = ( block ) =>
	createBlock( 'core/html', {
		content: block.originalContent,
	} );
const blockToBlocks = ( block ) =>
	rawHandler( {
		HTML: block.originalContent,
	} );
const recoverBlock = ( { name, attributes, innerBlocks } ) =>
	createBlock( name, attributes, innerBlocks );

export default compose( [
	withSelect( ( select, { clientId } ) => ( {
		block: select( blockEditorStore ).getBlock( clientId ),
	} ) ),
	withDispatch( ( dispatch, { block } ) => {
		const { replaceBlock } = dispatch( blockEditorStore );

		return {
			convertToClassic() {
				replaceBlock( block.clientId, blockToClassic( block ) );
			},
			convertToHTML() {
				replaceBlock( block.clientId, blockToHTML( block ) );
			},
			convertToBlocks() {
				replaceBlock( block.clientId, blockToBlocks( block ) );
			},
			attemptBlockRecovery() {
				replaceBlock( block.clientId, recoverBlock( block ) );
			},
		};
	} ),
] )( BlockInvalidWarning );
